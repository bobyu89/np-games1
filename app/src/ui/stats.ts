// 匿名的使用統計。只有建置的時候給了端點（VITE_STATS_URL）才會有；沒有給，這個檔什麼都不做。
// 端點可以是同一個網址底下的路徑（放在 Cloudflare 的時候是 /api），也可以是另一個網站的完整網址。
//
// 回傳的只有：一組隨機的裝置代號、哪一版、手機還是電腦、哪一張委託、做到第幾段、分數、花了多久。
// 沒有姓名、帳號，也沒有任何選的句子或寫的字。收的那一邊在 worker/，欄位以那邊的檢查為準。
// 玩家選「可以」之前，一筆都不會送出去；選「不要」，留在裝置上的也一起清掉。
import type { Safety } from '../core/types.ts';
import { isIos, isStandalone } from './pwa.ts';

export const STATS_URL = (import.meta.env.VITE_STATS_URL ?? '').trim().replace(/\/+$/, '');
/** 這一版有沒有統計的端點 */
export const statsBuilt = STATS_URL !== '';

/** ask：還沒問過。yes：可以回傳。no：不要 */
export type Consent = 'ask' | 'yes' | 'no';
/** open：打開遊戲（一天一次）。start：接了一張委託。leave：做到一半回公會。drop：放掉。done：結案並看完回顧 */
export interface StatEvent { t: 'open' | 'start' | 'leave' | 'drop' | 'done'; at: number; c?: string; tier?: number; ph?: number; sc?: number; sf?: Safety; sec?: number; gt?: number; h?: number; f?: 0 | 1; n?: number }
interface Box { consent: Consent; device: string; queue: StatEvent[]; opened: string }

const KEY = 'mist-guild.stats';
const blank = (): Box => ({ consent: 'ask', device: '', queue: [], opened: '' });
function read(): Box {
  try { const raw = JSON.parse(localStorage.getItem(KEY) || 'null') as Partial<Box> | null; return raw ? { ...blank(), ...raw, queue: Array.isArray(raw.queue) ? raw.queue : [] } : blank(); } catch { return blank(); }
}
function write(b: Box) { try { localStorage.setItem(KEY, JSON.stringify(b)); } catch { /* 記不住就算了 */ } }

const subs = new Set<() => void>();
let consent: Consent = statsBuilt ? read().consent : 'no';
export const statsSubscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const statsConsent = () => consent;

const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const newDevice = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (x) => x.toString(16).padStart(2, '0')).join('');
const platform = () => (isIos() ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : /windows|macintosh|linux|cros/i.test(navigator.userAgent) ? 'desktop' : 'other');

let sending = false;
/** 把留在裝置上的送出去。沒有網路就留著，下次再送 */
export async function flush(): Promise<void> {
  if (!statsBuilt || sending || navigator.onLine === false) return;   // 沒有網路就不試，等恢復的時候再送
  const box = read();
  if (box.consent !== 'yes' || !box.queue.length) return;
  if (!box.device) { box.device = newDevice(); write(box); }
  const batch = box.queue.slice(0, 40);
  sending = true;
  try {
    const res = await fetch(STATS_URL + '/e', { method: 'POST', body: JSON.stringify({ v: 1, d: box.device, b: __BUILD__, pf: platform(), pwa: isStandalone() ? 1 : 0, e: batch }),
      headers: { 'Content-Type': 'text/plain' }, keepalive: true, credentials: 'omit', referrerPolicy: 'same-origin' });   // 不把從哪一頁來的告訴別的網站
    // 收下了，或是對方說這一包不對（再送也沒有用）：都從裝置上拿掉。其他狀況留著
    if (res.ok || res.status === 400 || res.status === 413) {
      const now = read(), sent = new Set(batch.map((e) => e.t + e.at + (e.c ?? '')));
      write({ ...now, queue: now.queue.filter((e) => !sent.has(e.t + e.at + (e.c ?? ''))) });
      sending = false;
      if (res.ok && read().queue.length) return flush();
    }
  } catch { /* 沒有網路，或是端點暫時不通 */ }
  sending = false;
}

/** 記一件事。還沒問過同意的時候先留在裝置上，不送 */
export function track(e: Omit<StatEvent, 'at'>) {
  if (!statsBuilt) return;
  const box = read();
  if (box.consent === 'no') return;
  write({ ...box, queue: [...box.queue, { ...e, at: Math.floor(Date.now() / 1000) }].slice(-200) });
  if (box.consent === 'yes') void flush();
}
/** 打開遊戲：一天只記一次 */
export function trackOpen() {
  if (!statsBuilt) return;
  const box = read(), day = today();
  if (box.consent === 'no' || box.opened === day) return;
  write({ ...box, opened: day });
  track({ t: 'open' });
}
export function setConsent(c: 'yes' | 'no') {
  if (!statsBuilt) return;
  const box = read();
  // 不要：留在裝置上還沒送的、裝置代號，都清掉
  write(c === 'yes' ? { ...box, consent: 'yes' } : { ...blank(), consent: 'no' });
  consent = c;
  subs.forEach((f) => f());
  if (c === 'yes') void flush();
}
/** 開機的時候叫一次：恢復網路、切回這一頁的時候，把還沒送的送出去 */
export function startStats() {
  if (!statsBuilt) return;
  try {
    window.addEventListener('online', () => void flush());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void flush(); });
    void flush();
  } catch { /* 沒有這些事件的地方就算了 */ }
}
