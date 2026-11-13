// 真實的考試日，和「還有幾天」。首頁和委託板會顯示；不想看的人可以在設定關掉。
// 日期只寫在這一個地方。換年度、日期改了，改這一行就好。
// 這個日期是出題的人給的（115 年 12 月 5 日），沒有另外和主辦單位的公告核對。

/** date：西元的年月日（臺灣時間的那一天）。label：畫面上的寫法 */
export const EXAM = { date: '2026-12-05', label: '115 年 12 月 5 日' } as const;

/** 還有幾天。今天考是 0；已經過了是 null。照這台裝置的日期算，不管幾點 */
export function daysLeft(now: Date = new Date(), date: string = EXAM.date): number | null {
  const [y, m, d] = date.split('-').map(Number);
  const n = Math.round((new Date(y, m - 1, d).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);
  return n < 0 ? null : n;
}
/** 畫面上的那一句。過了就不顯示（回傳 null） */
export const countdownText = (n: number | null): string | null => (n === null ? null : n === 0 ? '考試就是今天' : '距離考試還有 ' + n + ' 天');

// 要不要顯示：存在這台裝置上，不跟著進度走（每一台可以不一樣）
const KEY = 'mist-guild.exam';
const subs = new Set<() => void>();
let shown = (() => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } })();
export const examShown = () => shown;
export const examSubscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export function setExamShown(on: boolean) {
  shown = on;
  try { if (on) localStorage.removeItem(KEY); else localStorage.setItem(KEY, 'off'); } catch { /* 記不住也沒關係 */ }
  subs.forEach((f) => f());
}
