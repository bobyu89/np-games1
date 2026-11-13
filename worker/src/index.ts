// 霧脈公會放在 Cloudflare 的那一個 Worker。遊戲和後端在同一個網址底下：
//   遊戲本身              靜態檔（app/dist），Cloudflare 直接給，不經過這個檔
//   POST /api/e           遊戲回傳匿名的使用統計（不用密碼；只收認得的欄位）
//   GET  /api/stats       總表（要管理密碼）
//   GET  /api/export.csv  每一筆事件一列（要管理密碼）
// 管理密碼是 Worker 的 secret：ADMIN_KEY。沒有設定的時候，總表一律不給看。
import { DurableObject } from 'cloudflare:workers';
import { SCHEMA, add, csv, parse, summary, type Exec, type Row, type Value } from './core.ts';

interface Env { STATS: DurableObjectNamespace<Stats>; ADMIN_KEY?: string; ALLOW_ORIGINS?: string }

const now = () => Math.floor(Date.now() / 1000);

/** 放資料的地方。全部只有一個，裡面是一個 SQLite 資料庫 */
export class Stats extends DurableObject<Env> {
  private exec: Exec;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.exec = (sql, ...params) => ctx.storage.sql.exec(sql, ...params).toArray() as Record<string, Value>[];
    SCHEMA.forEach((s) => this.exec(s));
  }
  add(rows: Row[]) { return add(this.exec, rows, now()); }
  summary(days: number | null) { return summary(this.exec, days, now()); }
  csv(days: number | null) { return csv(this.exec, days, now()); }
}

const local = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
/** 誰的網頁可以用後端：遊戲自己（同一個網址）、本機開發、設定裡另外列的 */
const allowed = (env: Env, origin: string | null, self: string) => !!origin && (origin === self || local(origin) || (env.ALLOW_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean).includes(origin));

async function sameKey(given: string, real: string) {
  const enc = new TextEncoder(), [a, b] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(given)), crypto.subtle.digest('SHA-256', enc.encode(real))]);
  return crypto.subtle.timingSafeEqual(a, b);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url), origin = req.headers.get('Origin'), ok = allowed(env, origin, url.origin);
    const cors: Record<string, string> = ok ? { 'Access-Control-Allow-Origin': origin!, Vary: 'Origin' } : {};
    const reply = (body: BodyInit | null, status = 200, more: Record<string, string> = {}) => new Response(body, { status, headers: { ...cors, 'Cache-Control': 'no-store', ...more } });
    const json = (data: unknown, status = 200) => reply(JSON.stringify(data), status, { 'Content-Type': 'application/json; charset=utf-8' });
    const text = (body: string, status: number) => reply(body, status, { 'Content-Type': 'text/plain; charset=utf-8' });
    // 不是靜態檔、也不在 /api/ 底下的網址會走到這裡
    if (!url.pathname.startsWith('/api/')) return text('沒有這一頁。', 404);
    const path = url.pathname.slice('/api'.length);
    // 別的網站的網頁不能用
    if (origin && !ok) return text('這個網址不在允許的名單裡。', 403);
    if (req.method === 'OPTIONS') return reply(null, 204, { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '86400' });
    const store = env.STATS.get(env.STATS.idFromName('main'));

    if (req.method === 'POST' && path === '/e') {
      const raw = await req.text();
      if (raw.length > 16_000) return text('太長了。', 413);
      let body: unknown;
      try { body = JSON.parse(raw); } catch { return text('看不懂。', 400); }
      const rows = parse(body, now());
      if (!rows) return text('格式不對。', 400);
      await store.add(rows);
      return reply(null, 204);
    }

    if (req.method === 'GET' && (path === '/stats' || path === '/export.csv')) {
      if (!env.ADMIN_KEY) return text('還沒有設定管理密碼（ADMIN_KEY）。', 503);
      const given = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
      if (!given || !(await sameKey(given, env.ADMIN_KEY))) return text('密碼不對。', 401);
      const d = Number(url.searchParams.get('days')), days = Number.isInteger(d) && d >= 1 && d <= 3650 ? d : null;
      if (path === '/stats') return json(await store.summary(days));
      return reply(await store.csv(days), 200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="mist-guild-events.csv"' });
    }

    return text('沒有這一頁。', 404);
  },
} satisfies ExportedHandler<Env>;
