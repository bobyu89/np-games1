// 帳號和進度同步的核心：登入到一半的狀態、帳號、登入狀態、雲端那一份進度。
// 和 core.ts 一樣不碰網路、不認得 Cloudflare，測試直接拿 SQLite 跑（accounts.test.ts）。
//
// 存的東西只有這些：
//   帳號   一組代號（登入服務給的使用者代號，加上只有這裡知道的一段亂數，再雜湊過）、用哪一家登入、建立和最後使用的時間
//   進度   遊戲匯出的那一段文字（和「設定 → 匯出進度」是同一種格式：代號和分數，沒有任何文字輸入）
//   登入狀態  瀏覽器那邊是一段亂數；這裡只存它的雜湊
// 不存姓名、電子郵件、頭像，也不存登入服務原本的使用者代號。和匿名的使用統計放在不同的資料庫，兩邊沒有共同的欄位。
import type { Exec } from './core.ts';

export const ACCOUNT_SCHEMA = [
  'CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS pending (state TEXT PRIMARY KEY, provider TEXT NOT NULL, nonce TEXT NOT NULL, exp INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, provider TEXT NOT NULL, created INTEGER NOT NULL, seen INTEGER NOT NULL, save TEXT, save_at INTEGER, save_build TEXT)',
  'CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, account TEXT NOT NULL, created INTEGER NOT NULL, exp INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS sessions_account ON sessions (account)',
];

export const PROVIDERS = ['google', 'line'] as const;
export type Provider = (typeof PROVIDERS)[number];
export const isProvider = (x: string): x is Provider => (PROVIDERS as readonly string[]).includes(x);

/** 登入要在十分鐘內走完；登入狀態留 180 天，有在用就會往後延；一份進度最多 120 KB（48 個病例全滿大約 20 KB） */
export const LIMIT = { pendingTtl: 600, pendingMax: 5000, sessionTtl: 180 * 86_400, sessionsPerAccount: 20, saveBytes: 120_000 };

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
/** 一段猜不到的亂數 */
export const random = (bytes = 32) => b64url(crypto.getRandomValues(new Uint8Array(bytes)));
export async function sha256(text: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), (x) => x.toString(16).padStart(2, '0')).join('');
}

/** 只有這個資料庫知道的一段亂數。第一次用到的時候產生，之後不變 */
export function pepperOf(exec: Exec): string {
  const row = exec("SELECT v FROM meta WHERE k = 'pepper'")[0];
  if (row) return String(row.v);
  const v = random();
  exec("INSERT OR IGNORE INTO meta (k, v) VALUES ('pepper', ?)", v);
  return String(exec("SELECT v FROM meta WHERE k = 'pepper'")[0].v);
}
/** 帳號的代號：看不出是哪一家的哪一個人，但同一個人每次登入都會算出同一組 */
export const accountId = (pepper: string, provider: Provider, sub: string) => sha256(pepper + '\n' + provider + '\n' + sub);

/** 開始登入：記下這一次的 state 和 nonce，等登入服務把人送回來的時候對 */
export function begin(exec: Exec, provider: Provider, state: string, nonce: string, now: number): boolean {
  exec('DELETE FROM pending WHERE exp < ?', now);
  // 同時在登入的人太多（或是有人在灌）：把最舊的幾筆讓出來，新的照樣可以登入
  const n = Number(exec('SELECT COUNT(*) AS n FROM pending')[0].n);
  if (n >= LIMIT.pendingMax) exec('DELETE FROM pending WHERE state IN (SELECT state FROM pending ORDER BY exp, rowid LIMIT ?)', n - LIMIT.pendingMax + 1);
  exec('INSERT INTO pending (state, provider, nonce, exp) VALUES (?, ?, ?, ?)', state, provider, nonce, now + LIMIT.pendingTtl);
  return true;
}
/** 登入服務把人送回來了：state 對得上、還沒過期、沒用過，才回傳當時的 nonce。每個 state 只能用一次 */
export function finish(exec: Exec, provider: Provider, state: string, now: number): string | null {
  const row = exec('SELECT nonce, exp FROM pending WHERE state = ? AND provider = ?', state, provider)[0];
  exec('DELETE FROM pending WHERE state = ?', state);
  return row && Number(row.exp) >= now ? String(row.nonce) : null;
}

/** 登入成功：沒有帳號就建一個，然後記下這個瀏覽器的登入狀態（只存雜湊） */
export function signIn(exec: Exec, id: string, provider: Provider, tokenHash: string, now: number): void {
  exec('INSERT INTO accounts (id, provider, created, seen) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET seen = excluded.seen', id, provider, now, now);
  exec('DELETE FROM sessions WHERE exp < ?', now);
  exec('INSERT INTO sessions (token, account, created, exp) VALUES (?, ?, ?, ?)', tokenHash, id, now, now + LIMIT.sessionTtl);
  // 同一個帳號登入太多台：最舊的先登出
  exec('DELETE FROM sessions WHERE account = ? AND token NOT IN (SELECT token FROM sessions WHERE account = ? ORDER BY created DESC, rowid DESC LIMIT ?)', id, id, LIMIT.sessionsPerAccount);
}

export interface Who { id: string; provider: Provider; since: number }
/** 這個登入狀態是誰的。過期的不算；剩不到一半的時候順手往後延 */
export function who(exec: Exec, tokenHash: string, now: number): Who | null {
  const row = exec('SELECT s.account AS id, s.exp AS exp, a.provider AS provider, a.created AS created FROM sessions s JOIN accounts a ON a.id = s.account WHERE s.token = ?', tokenHash)[0];
  if (!row || Number(row.exp) < now) return null;
  if (Number(row.exp) - now < LIMIT.sessionTtl / 2) exec('UPDATE sessions SET exp = ? WHERE token = ?', now + LIMIT.sessionTtl, tokenHash);
  return { id: String(row.id), provider: String(row.provider) as Provider, since: Number(row.created) };
}
export function signOut(exec: Exec, tokenHash: string): void { exec('DELETE FROM sessions WHERE token = ?', tokenHash); }

/** 這一段文字像不像遊戲匯出的進度。像的話回傳它是哪一版存的 */
export function checkSave(text: string): { ok: true; build: string } | { ok: false; why: string } {
  if (new TextEncoder().encode(text).length > LIMIT.saveBytes) return { ok: false, why: '太長了。' };
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, why: '看不懂。' }; }
  const r = raw as Record<string, unknown> | null;
  if (!r || typeof r !== 'object' || r.app !== 'mist-guild' || r.kind !== 'save' || typeof r.v !== 'number' || !r.cases || typeof r.cases !== 'object') return { ok: false, why: '這不是霧脈公會的進度。' };
  return { ok: true, build: typeof r.build === 'string' ? r.build.slice(0, 40) : '' };
}
export function readSave(exec: Exec, id: string): { save: string | null; at: number | null } {
  const row = exec('SELECT save, save_at FROM accounts WHERE id = ?', id)[0];
  return { save: row?.save == null ? null : String(row.save), at: row?.save_at == null ? null : Number(row.save_at) };
}
export function writeSave(exec: Exec, id: string, text: string, build: string, now: number): number {
  exec('UPDATE accounts SET save = ?, save_at = ?, save_build = ?, seen = ? WHERE id = ?', text, now, build, now, id);
  return now;
}
/** 刪掉帳號：雲端那一份進度、每一台的登入狀態，都一起刪 */
export function remove(exec: Exec, id: string): void {
  exec('DELETE FROM sessions WHERE account = ?', id);
  exec('DELETE FROM accounts WHERE id = ?', id);
}
/** 有幾個帳號、幾份進度（給管理的總表看；只有數字） */
export function counts(exec: Exec): { accounts: number; saves: number; google: number; line: number } {
  const r = exec("SELECT COUNT(*) AS accounts, COUNT(save) AS saves, SUM(provider = 'google') AS google, SUM(provider = 'line') AS line FROM accounts")[0];
  return { accounts: Number(r.accounts), saves: Number(r.saves), google: Number(r.google ?? 0), line: Number(r.line ?? 0) };
}

/** 讀出登入服務給的身分憑證裡寫的東西，檢查是不是給我們的、是不是這一次的、過期了沒。
 *  憑證是後端直接向登入服務的網址（HTTPS）拿的，不經過瀏覽器，所以照 OpenID Connect 的規定可以不另外驗簽章。 */
export function checkClaims(idToken: string, want: { iss: string[]; aud: string; nonce: string }, now: number): { ok: true; sub: string } | { ok: false; why: string } {
  const part = idToken.split('.')[1];
  let c: Record<string, unknown>;
  try {
    const bin = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    c = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)))) as Record<string, unknown>;
  } catch { return { ok: false, why: 'unreadable' }; }
  if (!c || typeof c !== 'object') return { ok: false, why: 'unreadable' };
  if (typeof c.iss !== 'string' || !want.iss.includes(c.iss)) return { ok: false, why: 'issuer' };
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (!aud.includes(want.aud)) return { ok: false, why: 'audience' };
  if (typeof c.exp !== 'number' || c.exp < now - 60) return { ok: false, why: 'expired' };
  if (c.nonce !== want.nonce) return { ok: false, why: 'nonce' };
  if (typeof c.sub !== 'string' || !c.sub || c.sub.length > 255) return { ok: false, why: 'subject' };
  return { ok: true, sub: c.sub };
}
