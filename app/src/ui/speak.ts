// 說出口的練習：回報醫師、向病人說明之前，先停 30 秒，把要說的話說一遍（大聲說或在心裡說），再看選項。
// 口試是用說的，遊戲是用點的：先自己說（回想），再看選項（辨認）。不錄音、不辨識語音，什麼都不送出去。
// 要不要先說：存在這台裝置上，不跟著進度走。預設要；可以在設定關掉，或每一次按「跳過」。
export const SPEAK_SECONDS = 30;

const KEY = 'mist-guild.speak';
const subs = new Set<() => void>();
let on = (() => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } })();
export const speakOn = () => on;
export const speakSubscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export function setSpeakOn(v: boolean) {
  on = v;
  try { if (v) localStorage.removeItem(KEY); else localStorage.setItem(KEY, 'off'); } catch { /* 記不住也沒關係 */ }
  subs.forEach((f) => f());
}
