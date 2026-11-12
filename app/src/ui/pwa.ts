// 離線可玩、更新、安裝到主畫面。
// 沒有 service worker 的地方（開發時、示範頁、很舊的瀏覽器）就安靜地什麼都不做：遊戲照樣能玩，只是要有網路。
interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

/** offline：這台裝置已經存好一份，沒有網路也能開。update：新版下載好了，等著換上。canInstall：瀏覽器願意跳出安裝的視窗 */
export interface PwaState { supported: boolean; offline: boolean; update: boolean; canInstall: boolean }
let state: PwaState = { supported: false, offline: false, update: false, canInstall: false };
const subs = new Set<() => void>();
const set = (p: Partial<PwaState>) => { state = { ...state, ...p }; subs.forEach((f) => f()); };
let reg: ServiceWorkerRegistration | null = null, installEvt: InstallEvent | null = null, reloading = false;

export const pwaSubscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const pwaState = () => state;

export function startPwa() {
  try {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e as InstallEvent; set({ canInstall: true }); });
    window.addEventListener('appinstalled', () => { installEvt = null; set({ canInstall: false }); });
    if (import.meta.env.DEV || !('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    const sw = navigator.serviceWorker;
    // 換上新版之後整頁重新載入。只有玩家自己按了「更新」才會走到這裡，不會在委託做到一半的時候發生
    sw.addEventListener('controllerchange', () => { if (reloading) location.reload(); });
    sw.register('sw.js').then((r) => {
      reg = r;
      set({ supported: true, offline: !!sw.controller, update: !!r.waiting && !!sw.controller });
      // 下載好了：原本就有一版在跑，就是「有新版等著換」；沒有，就是第一次存好
      const watch = (next: ServiceWorker | null) => next?.addEventListener('statechange', () => { if (next.state === 'installed') set(sw.controller ? { update: true } : { offline: true }); });
      watch(r.installing);   // 註冊回來的時候可能已經在下載了，這時候不會再通知一次
      r.addEventListener('updatefound', () => watch(r.installing));
    }).catch(() => { /* 示範頁之類的地方註冊不了，照常玩 */ });
  } catch { /* 同上 */ }
}

/** 換上已經下載好的新版 */
export function applyUpdate() {
  if (!reg?.waiting) { location.reload(); return; }
  reloading = true;
  reg.waiting.postMessage('skip-waiting');
}
/** 問一次伺服器有沒有新版。回傳「有沒有」；沒有網路就當作沒有 */
export async function checkUpdate(): Promise<boolean> {
  try { await reg?.update(); } catch { return false; }
  await new Promise((ok) => setTimeout(ok, 1200));
  return state.update || !!reg?.installing;
}
export async function install(): Promise<boolean> {
  if (!installEvt) return false;
  const e = installEvt;
  installEvt = null; set({ canInstall: false });
  try { await e.prompt(); return (await e.userChoice).outcome === 'accepted'; } catch { return false; }
}
/** 是不是從主畫面的圖示開的 */
export const isStandalone = () => { try { return matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true; } catch { return false; } };
export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
/** 請瀏覽器不要在空間不夠的時候把進度清掉。答不答應由瀏覽器決定 */
export function keepStorage() { try { void navigator.storage?.persist?.().catch(() => false); } catch { /* 沒有這個功能 */ } }
