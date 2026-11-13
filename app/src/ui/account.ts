// 登入和進度同步（選用）。不登入照樣能玩；登入只是讓進度在雲端多一份，換手機、換瀏覽器接得上。
//
// 裝置上的那一份永遠是主要的：遊戲只讀裝置上的進度，雲端連不到也不影響。
// 同步的做法是「兩邊併起來」（backup.ts 的 mergeSaves）：每個病例留比較好的那一次，所以不會互相蓋掉。
// 後端在同一個網址的 api/ 底下（worker/）。放在沒有後端的地方（別的靜態主機、離線），這個檔什麼都不做。
import { CASES } from '../data/index.ts';
import { mergeSaves, packSave, readBackup, sameSave } from './backup.ts';
import type { Save } from './store.ts';

export type Provider = 'google' | 'line';
export const PROVIDER_NAME: Record<Provider, string> = { google: 'Google', line: 'LINE' };
/** sync：idle 還沒同步過。busy 同步中。ok 同步好了。fail 這一次沒成功。old 這一台的遊戲比雲端那一份舊，只下載、不上傳 */
export interface AccountState {
  ready: boolean; /** 這個地方有沒有後端（登入、回報問題都要靠它） */ backend: boolean; providers: Provider[]; account: { provider: Provider; since: number } | null;
  sync: 'idle' | 'busy' | 'ok' | 'fail' | 'old'; syncedAt: number | null; flash: { text: string; bad?: boolean } | null;
}

/** 登入完被送回來的時候，網址後面帶的結果 */
const RESULT: Record<string, { text: string; bad?: boolean }> = {
  'signed-in': { text: '登入好了。' },
  'sign-in=cancelled': { text: '登入取消了。', bad: true },
  'sign-in=expired': { text: '登入花太久，過期了。請再按一次。', bad: true },
  'sign-in=failed': { text: '登入沒有成功。請再試一次；如果是在 LINE 或其他 App 裡開的，改用 Safari 或 Chrome 開。', bad: true },
  'sign-in=busy': { text: '現在登入的人太多，請過幾分鐘再試。', bad: true },
  'sign-in=off': { text: '這一種登入還沒有開放。', bad: true },
};

// 這一段在畫面第一次畫之前就要知道：剛登入完回來的話，首頁要直接打開帳號那一頁
const arrived = typeof location === 'undefined' ? undefined : RESULT[location.hash.slice(1)];
let state: AccountState = { ready: false, backend: false, providers: [], account: null, sync: 'idle', syncedAt: null, flash: arrived ?? null };
const subs = new Set<() => void>();
const set = (patch: Partial<AccountState>) => { state = { ...state, ...patch }; subs.forEach((f) => f()); };
export const accountSubscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const accountState = () => state;

const api = (path: string) => new URL('api/' + path, document.baseURI).href;
const online = () => /^https?:$/.test(location.protocol) && navigator.onLine !== false;
const call = (path: string, init: RequestInit = {}) => fetch(api(path), { credentials: 'same-origin', cache: 'no-store', ...init });

// 進度在 App 手上：登記怎麼讀、怎麼換上併好的那一份
let getSave: (() => Save) | null = null, putSave: ((s: Save) => void) | null = null;
export function bindSave(get: () => Save, put: (s: Save) => void) { getSave = get; putSave = put; }

/** 問後端：開了哪幾種登入、現在有沒有登入 */
async function refresh(): Promise<void> {
  if (!online()) { set({ ready: true }); return; }
  try {
    const res = await call('me');
    const data = res.ok && (res.headers.get('Content-Type') ?? '').includes('json') ? ((await res.json()) as { v?: number; providers?: Provider[]; account?: AccountState['account'] }) : null;
    if (data?.v === 1 && Array.isArray(data.providers)) set({ ready: true, backend: true, providers: data.providers.filter((p) => p === 'google' || p === 'line'), account: data.account ?? null });
    else set({ ready: true, providers: [], account: null });   // 這個地方沒有後端
  } catch { set({ ready: true }); }
}

export async function startAccount(): Promise<void> {
  if (arrived) history.replaceState(null, '', location.pathname + location.search);   // 網址後面那一段用完就拿掉
  // 打開的時候同步一次；沒有網路的話，等連上了再問後端、再同步
  const wake = async () => { if (!state.account) await refresh(); if (state.account) void syncNow(); };
  await wake();
  window.addEventListener('online', () => void wake());
}
/** 剛登入完回來：設定頁要自己打開，讓人看到結果 */
export const cameBack = () => state.flash !== null;
export const clearFlash = () => { if (state.flash) set({ flash: null }); };

/** 去登入。整頁會先跳到 Google 或 LINE，登入完再回來 */
export function signInWith(p: Provider) { location.assign(api('auth/' + p + '/start')); }

let running: Promise<void> | null = null, again = false;
/** 同步一次：拿雲端那一份 → 和這一台的併起來 → 這一台換上 → 雲端也換上 */
export function syncNow(): Promise<void> {
  if (running) { again = true; return running; }
  running = (async () => {
    if (!state.account || !getSave || !putSave || !online()) return;
    set({ sync: 'busy' });
    try {
      const res = await call('save');
      if (res.status === 401) { set({ account: null, sync: 'idle' }); return; }   // 登入狀態過期，或在別台刪了帳號
      if (!res.ok) throw new Error(String(res.status));
      const cloud = (await res.json()) as { save: string | null; at: number | null };
      let merged = getSave(), upload = true, behind = false;
      if (cloud.save) {
        const r = readBackup(cloud.save, CASES);
        // 雲端那一份這一版讀不了，或是裡面有這一版不認得的病例：是比較新的遊戲存的。這一台只下載、不上傳，免得把新的蓋掉
        if (!r.ok) { set({ sync: 'old' }); return; }
        behind = r.dropped > 0;
        merged = mergeSaves(getSave(), r.save);
        if (!sameSave(merged, getSave())) putSave(merged);
        upload = !behind && !sameSave(merged, r.save);   // 雲端已經是最新的就不用再傳
      }
      if (upload) {
        const put = await call('save', { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: packSave(merged, __BUILD__) });
        if (put.status === 401) { set({ account: null, sync: 'idle' }); return; }
        if (!put.ok) throw new Error(String(put.status));
      }
      set({ sync: behind ? 'old' : 'ok', syncedAt: Date.now() });
    } catch { set({ sync: 'fail' }); }
  })().finally(() => { running = null; if (again) { again = false; void syncNow(); } });
  return running;
}

let timer = 0;
/** 進度變了：過幾秒同步一次（連續變好幾次只同步一次） */
export function syncSoon() {
  if (!state.account) return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void syncNow(), 2500);
}

/** 登出這一台。裝置上的進度留著 */
export async function signOut(): Promise<boolean> {
  try { const res = await call('signout', { method: 'POST' }); if (!res.ok) return false; } catch { return false; }
  set({ account: null, sync: 'idle', syncedAt: null });
  return true;
}
/** 刪掉帳號和雲端那一份。裝置上的進度留著 */
export async function deleteAccount(): Promise<boolean> {
  try { const res = await call('account', { method: 'DELETE' }); if (!res.ok && res.status !== 401) return false; } catch { return false; }
  set({ account: null, sync: 'idle', syncedAt: null });
  return true;
}

/** 是不是在 LINE 裡面開的。Google 不讓人在別的 App 的內建瀏覽器裡登入，所以那裡只給 LINE */
export const inLine = () => /\bLine\//i.test(navigator.userAgent);
/** 其他 App 的內建瀏覽器（Facebook、Instagram、Messenger）：Google 登入多半會被擋 */
export const inOtherApp = () => /FBAN|FBAV|FB_IAB|Instagram|Messenger/i.test(navigator.userAgent);
