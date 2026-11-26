// 試弓的時間分配：站內 15 分鐘，每一段實際花了多久，和遊戲建議的分配比一比。
// 建議的分配是遊戲自己定的（不是甄審的規定）：問診 5 分、評估 4 分、下診斷 2 分、檢查回報說明 3 分，留 1 分鐘回頭檢查。
import type { Session } from '../core/types.ts';

export const PLAN = [
  { key: 'ask', name: '問診', sec: 300 },
  { key: 'exam', name: '身體評估', sec: 240 },
  { key: 'dx', name: '下診斷', sec: 120 },
  { key: 'plan', name: '檢查、回報、說明', sec: 180 },
] as const;
/** 建議留給最後回頭檢查的時間 */
export const SPARE = 60;

export interface Split { key: string; name: string; sec: number; plan: number; reached: boolean }

/** 每一段實際花的秒數。沒有記到時間（舊的對局）回傳 null */
export function phaseSplit(s: Pick<Session, 'phaseAt' | 'phase'>, seconds: number): Split[] | null {
  if (!s.phaseAt) return null;
  const end = Math.max(0, seconds), at = [0, ...[0, 1, 2].map((i) => Math.min(end, s.phaseAt![i] ?? end)), end];
  for (let i = 1; i < at.length; i++) at[i] = Math.max(at[i], at[i - 1]);
  return PLAN.map((p, i) => ({ key: p.key, name: p.name, sec: at[i + 1] - at[i], plan: p.sec, reached: i === 0 || s.phaseAt!.length >= i }));
}

const m = (sec: number) => (sec >= 60 ? Math.floor(sec / 60) + ' 分' + (sec % 60 ? ' ' + (sec % 60) + ' 秒' : '') : sec + ' 秒');
export const mmText = m;

/** 一句話：最超時的那一段、沒走到的那一段 */
export function timingNote(split: Split[], timeUp: boolean): string {
  const notReached = split.filter((x) => !x.reached).map((x) => x.name);
  const over = [...split].filter((x) => x.reached).sort((a, b) => (b.sec - b.plan) - (a.sec - a.plan))[0];
  const parts: string[] = [];
  if (notReached.length) parts.push((timeUp ? '時間到的時候，' : '交卷的時候，') + '還沒走到：' + notReached.join('、') + '。這幾段的分數拿不到，比每一段都做一點更虧。');
  if (over && over.sec - over.plan >= 60) parts.push(over.name + '比建議多花了 ' + m(over.sec - over.plan) + '。下一次在這一段給自己設一個停損點。');
  if (!parts.length) parts.push('每一段都在建議的時間附近，節奏是對的。');
  return parts.join('');
}
