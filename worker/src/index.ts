// 霧脈公會放在 Cloudflare 的那一個 Worker。遊戲和後端在同一個網址底下：
//   遊戲本身                        靜態檔（app/dist），Cloudflare 直接給，不經過這個檔
//   匿名的使用統計
//     POST /api/e                   遊戲回傳事件（不用密碼；只收認得的欄位）
//     GET  /api/stats               總表（要管理密碼）
//     GET  /api/export.csv          每一筆事件一列（要管理密碼）
//   玩家的回報
//     POST /api/report              哪裡有錯、哪裡卡住、有什麼建議（匿名）
//     GET  /api/reports             最近的回報（要管理密碼）
//   登入和進度同步（選用；不登入照樣能玩）
//     GET  /api/me                  開了哪幾種登入、現在有沒有登入
//     GET  /api/auth/<哪一家>/start     把人送去 Google 或 LINE 登入
//     GET  /api/auth/<哪一家>/callback  登入完被送回來：換身分憑證、記下登入狀態、回到遊戲
//     GET  /api/save、PUT /api/save 讀、寫雲端那一份進度（要登入）
//     POST /api/signout             登出這一台
//     DELETE /api/account           刪掉帳號和雲端的進度
//   定時器（不是網址；wrangler.jsonc 的 triggers）
//     每天早上                      把當天的「每日一案」發到遊戲的 Threads 帳號（src/daily.ts；要 secret：THREADS_ACCESS_TOKEN）
// 管理密碼是 Worker 的 secret：ADMIN_KEY。沒有設定的時候，總表一律不給看。
// 登入要另外設定 GOOGLE_CLIENT_ID／GOOGLE_CLIENT_SECRET、LINE_CHANNEL_ID／LINE_CHANNEL_SECRET；哪一家沒設定，那一家就不會出現。
import { DurableObject } from 'cloudflare:workers';
import { SCHEMA, add, addReport, csv, listReports, parse, parseReport, summary, type Exec, type Report, type Row, type Value } from './core.ts';
import { daily, type DailyEnv } from './daily.ts';
import { ACCOUNT_SCHEMA, LIMIT, PROVIDERS, accountId, begin, checkClaims, checkSave, counts, finish, isProvider, pepperOf, random, readSave, remove, sha256, signIn, signOut, who, writeSave, type Provider } from './accounts.ts';

interface Env extends DailyEnv {
  STATS: DurableObjectNamespace<Stats>; ACCOUNTS: DurableObjectNamespace<Accounts>; ADMIN_KEY?: string; ALLOW_ORIGINS?: string;
  GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string; LINE_CHANNEL_ID?: string; LINE_CHANNEL_SECRET?: string;
  // 只有測試會設：把登入服務換成本機的假服務
  GOOGLE_AUTH_URL?: string; GOOGLE_TOKEN_URL?: string; GOOGLE_ISSUER?: string; LINE_AUTH_URL?: string; LINE_TOKEN_URL?: string; LINE_ISSUER?: string;
}

const now = () => Math.floor(Date.now() / 1000);
const sqlOf = (ctx: DurableObjectState): Exec => (sql, ...params) => ctx.storage.sql.exec(sql, ...params).toArray() as Record<string, Value>[];

/** 放匿名統計的地方。全部只有一個，裡面是一個 SQLite 資料庫 */
export class Stats extends DurableObject<Env> {
  private exec: Exec;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.exec = sqlOf(ctx);
    SCHEMA.forEach((s) => this.exec(s));
  }
  add(rows: Row[]) { return add(this.exec, rows, now()); }
  summary(days: number | null) { return summary(this.exec, days, now()); }
  csv(days: number | null) { return csv(this.exec, days, now()); }
  addReport(r: Report) { return addReport(this.exec, r); }
  reports(days: number | null) { return listReports(this.exec, days, now()); }
}

/** 放帳號和雲端進度的地方。和統計是分開的兩個資料庫，沒有共同的欄位 */
export class Accounts extends DurableObject<Env> {
  private exec: Exec;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.exec = sqlOf(ctx);
    ACCOUNT_SCHEMA.forEach((s) => this.exec(s));
  }
  begin(provider: Provider, state: string, nonce: string) { return begin(this.exec, provider, state, nonce, now()); }
  finish(provider: Provider, state: string) { return finish(this.exec, provider, state, now()); }
  /** sub 是登入服務給的使用者代號：只在這裡用來算出帳號的代號，不存下來 */
  async signIn(provider: Provider, sub: string, tokenHash: string) { signIn(this.exec, await accountId(pepperOf(this.exec), provider, sub), provider, tokenHash, now()); }
  who(tokenHash: string) { return who(this.exec, tokenHash, now()); }
  signOut(tokenHash: string) { signOut(this.exec, tokenHash); }
  readSave(id: string) { return readSave(this.exec, id); }
  writeSave(id: string, text: string, build: string) { return writeSave(this.exec, id, text, build, now()); }
  remove(id: string) { remove(this.exec, id); }
  counts() { return counts(this.exec); }
}

const local = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
/** 誰的網頁可以用後端：遊戲自己（同一個網址）、本機開發、設定裡另外列的 */
const allowed = (env: Env, origin: string | null, self: string) => !!origin && (origin === self || local(origin) || (env.ALLOW_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean).includes(origin));

async function sameKey(given: string, real: string) {
  const enc = new TextEncoder(), [a, b] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(given)), crypto.subtle.digest('SHA-256', enc.encode(real))]);
  return crypto.subtle.timingSafeEqual(a, b);
}

interface Login { id: string; secret: string; auth: string; token: string; iss: string[]; extra: Record<string, string> }
/** 設定了哪幾家登入。沒有設定代號和密鑰的那一家是 null */
function logins(env: Env): Record<Provider, Login | null> {
  return {
    google: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
      id: env.GOOGLE_CLIENT_ID, secret: env.GOOGLE_CLIENT_SECRET, auth: env.GOOGLE_AUTH_URL ?? 'https://accounts.google.com/o/oauth2/v2/auth', token: env.GOOGLE_TOKEN_URL ?? 'https://oauth2.googleapis.com/token',
      iss: (env.GOOGLE_ISSUER ?? 'https://accounts.google.com,accounts.google.com').split(','), extra: { prompt: 'select_account' },
    } : null,
    line: env.LINE_CHANNEL_ID && env.LINE_CHANNEL_SECRET ? {
      id: env.LINE_CHANNEL_ID, secret: env.LINE_CHANNEL_SECRET, auth: env.LINE_AUTH_URL ?? 'https://access.line.me/oauth2/v2.1/authorize', token: env.LINE_TOKEN_URL ?? 'https://api.line.me/oauth2/v2.1/token',
      iss: (env.LINE_ISSUER ?? 'https://access.line.me').split(','), extra: {},
    } : null,
  };
}

const SESSION = 'mg_s', FLOW = 'mg_o';
const cookieOf = (req: Request, name: string) => (req.headers.get('Cookie') ?? '').split(/;\s*/).map((p) => p.split('=')).find(([k]) => k === name)?.[1] ?? '';
/** 瀏覽器的程式讀不到（HttpOnly）、別的網站帶不過來（SameSite=Lax） */
const setCookie = (name: string, value: string, maxAge: number, secure: boolean) => `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url), origin = req.headers.get('Origin'), ok = allowed(env, origin, url.origin), secure = url.protocol === 'https:';
    const cors: Record<string, string> = ok ? { 'Access-Control-Allow-Origin': origin!, Vary: 'Origin' } : {};
    const reply = (body: BodyInit | null, status = 200, more: Record<string, string> = {}, cookies: string[] = []) => {
      const headers = new Headers({ ...cors, 'Cache-Control': 'no-store', ...more });
      cookies.forEach((c) => headers.append('Set-Cookie', c));
      return new Response(body, { status, headers });
    };
    const json = (data: unknown, status = 200, cookies: string[] = []) => reply(JSON.stringify(data), status, { 'Content-Type': 'application/json; charset=utf-8' }, cookies);
    const text = (body: string, status: number) => reply(body, status, { 'Content-Type': 'text/plain; charset=utf-8' });
    // 不是靜態檔、也不在 /api/ 底下的網址會走到這裡
    if (!url.pathname.startsWith('/api/')) return text('沒有這一頁。', 404);
    const path = url.pathname.slice('/api'.length);
    // 別的網站的網頁不能用
    if (origin && !ok) return text('這個網址不在允許的名單裡。', 403);
    if (req.method === 'OPTIONS') return reply(null, 204, { 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '86400' });

    // ── 匿名的使用統計 ──
    if (req.method === 'POST' && path === '/e') {
      const raw = await req.text();
      if (raw.length > 16_000) return text('太長了。', 413);
      let body: unknown;
      try { body = JSON.parse(raw); } catch { return text('看不懂。', 400); }
      const rows = parse(body, now());
      if (!rows) return text('格式不對。', 400);
      await env.STATS.get(env.STATS.idFromName('main')).add(rows);
      return reply(null, 204);
    }
    if (req.method === 'POST' && path === '/report') {
      if (!ok) return text('這個網址不在允許的名單裡。', 403);   // 一定要是遊戲自己的網頁送的
      const raw = await req.text();
      if (raw.length > 8_000) return text('太長了。', 413);
      let body: unknown;
      try { body = JSON.parse(raw); } catch { return text('看不懂。', 400); }
      const r = parseReport(body, now());
      if (!r) return text('格式不對。', 400);
      return (await env.STATS.get(env.STATS.idFromName('main')).addReport(r)) ? reply(null, 204) : text('今天收到的回報太多了，請明天再試。', 429);
    }
    if (req.method === 'GET' && (path === '/stats' || path === '/export.csv' || path === '/reports')) {
      if (!env.ADMIN_KEY) return text('還沒有設定管理密碼（ADMIN_KEY）。', 503);
      const given = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
      if (!given || !(await sameKey(given, env.ADMIN_KEY))) return text('密碼不對。', 401);
      const d = Number(url.searchParams.get('days')), days = Number.isInteger(d) && d >= 1 && d <= 3650 ? d : null;
      const store = env.STATS.get(env.STATS.idFromName('main'));
      // 帳號那一邊只給數字：有幾個帳號、幾份雲端的進度
      if (path === '/reports') return json({ reports: await store.reports(days) });
      if (path === '/stats') return json({ ...(await store.summary(days)), accounts: await env.ACCOUNTS.get(env.ACCOUNTS.idFromName('main')).counts() });
      return reply(await store.csv(days), 200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="mist-guild-events.csv"' });
    }

    // ── 登入和進度同步 ──
    const set = logins(env), accounts = () => env.ACCOUNTS.get(env.ACCOUNTS.idFromName('main'));
    const token = cookieOf(req, SESSION), me = async () => (token ? accounts().who(await sha256(token)) : null);
    const signedOut = [setCookie(SESSION, '', 0, secure)];

    if (req.method === 'GET' && path === '/me') {
      const user = await me();
      return json({ v: 1, providers: PROVIDERS.filter((p) => set[p]), account: user ? { provider: user.provider, since: user.since } : null }, 200, token && !user ? signedOut : []);
    }

    const auth = /^\/auth\/([a-z]+)\/(start|callback)$/.exec(path);
    if (req.method === 'GET' && auth) {
      const provider = auth[1], cfg = isProvider(provider) ? set[provider] : null;
      const home = (hash: string, cookies: string[] = []) => reply(null, 302, { Location: url.origin + '/#' + hash }, cookies);
      if (!isProvider(provider) || !cfg) return home('sign-in=off');
      const redirect = url.origin + '/api/auth/' + provider + '/callback';
      if (auth[2] === 'start') {
        const state = random(24), nonce = random(24);
        if (!(await accounts().begin(provider, state, nonce))) return home('sign-in=busy');
        const to = new URL(cfg.auth);
        Object.entries({ response_type: 'code', client_id: cfg.id, redirect_uri: redirect, scope: 'openid', state, nonce, ...cfg.extra }).forEach(([k, v]) => to.searchParams.set(k, v));
        // 同一個瀏覽器開始的，才能在這個瀏覽器完成
        return reply(null, 302, { Location: to.toString() }, [setCookie(FLOW, state, LIMIT.pendingTtl, secure)]);
      }
      const done = [setCookie(FLOW, '', 0, secure)], q = url.searchParams, state = q.get('state') ?? '', code = q.get('code') ?? '';
      if (q.get('error')) { if (state) await accounts().finish(provider, state); return home('sign-in=cancelled', done); }
      if (!state || !code || cookieOf(req, FLOW) !== state) return home('sign-in=failed', done);
      const nonce = await accounts().finish(provider, state);
      if (!nonce) return home('sign-in=expired', done);
      let idToken = '';
      try {
        const res = await fetch(cfg.token, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
          body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect, client_id: cfg.id, client_secret: cfg.secret }) });
        if (res.ok) idToken = String(((await res.json()) as { id_token?: unknown }).id_token ?? '');
      } catch { /* 登入服務沒有回應：當成失敗 */ }
      const claims = idToken ? checkClaims(idToken, { iss: cfg.iss, aud: cfg.id, nonce }, now()) : null;
      if (!claims?.ok) return home('sign-in=failed', done);
      const fresh = random(32);
      await accounts().signIn(provider, claims.sub, await sha256(fresh));
      return home('signed-in', [...done, setCookie(SESSION, fresh, LIMIT.sessionTtl, secure)]);
    }

    if (path === '/save' || path === '/signout' || path === '/account') {
      // 會改東西的請求，一定要是遊戲自己的網頁送的
      if (req.method !== 'GET' && !ok) return text('這個網址不在允許的名單裡。', 403);
      const user = await me();
      if (req.method === 'POST' && path === '/signout') { if (token) await accounts().signOut(await sha256(token)); return reply(null, 204, {}, signedOut); }
      if (!user) return reply('還沒有登入。', 401, { 'Content-Type': 'text/plain; charset=utf-8' }, token ? signedOut : []);
      if (req.method === 'GET' && path === '/save') return json(await accounts().readSave(user.id));
      if (req.method === 'PUT' && path === '/save') {
        const raw = await req.text(), check = checkSave(raw);
        if (!check.ok) return text(check.why, raw.length > LIMIT.saveBytes ? 413 : 400);
        return json({ at: await accounts().writeSave(user.id, raw, check.build) });
      }
      if (req.method === 'DELETE' && path === '/account') { await accounts().remove(user.id); return reply(null, 204, {}, signedOut); }
    }

    return text('沒有這一頁。', 404);
  },
  // 每天早上的定時器。出錯就讓這一次算失敗：Cloudflare 的定時器紀錄裡看得到，GitHub 那一邊的後備排程晚一點會補發
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    await daily(env);
  },
} satisfies ExportedHandler<Env>;
