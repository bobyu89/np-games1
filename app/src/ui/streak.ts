// 打卡：哪幾天有真的練到（結案一張委託，或交一次試弓）。
// 只記日期（這台裝置的當地日期），跟著進度存、匯出和同步；不收任何研究資料。
// 連續天數：中間缺一天就斷，但每個月有一天可以休息（缺的那一天前後都有打卡，就接得起來）。休息的那一天不算進天數。

/** 這台裝置的當地日期，例如 2026-11-23 */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const isDay = (x: unknown): x is string => typeof x === 'string' && DAY.test(x) && !Number.isNaN(Date.parse(x + 'T00:00:00Z'));
/** 日期往前或往後幾天（用 UTC 算，不受夏令時間影響） */
export function shift(day: string, n: number): string {
  return new Date(Date.parse(day + 'T00:00:00Z') + n * 86_400_000).toISOString().slice(0, 10);
}
const month = (day: string) => day.slice(0, 7);

/** 存的天數上限：大約兩年。多的留最近的 */
export const DAYS_KEPT = 800;
/** 加上一天，排好、去掉重複，留最近的 DAYS_KEPT 天 */
export function addDay(days: string[] | undefined, day: string): string[] {
  return [...new Set([...(days ?? []), day])].filter(isDay).sort().slice(-DAYS_KEPT);
}

export interface Streak {
  /** 現在連續幾天（休息日不算） */
  count: number;
  /** 今天打卡了沒 */
  today: boolean;
  /** 這一段裡，這個月的休息日用掉了沒 */
  restUsed: boolean;
  /** 最長的一段 */
  best: number;
  /** 一共打卡幾天 */
  total: number;
}

/** 從今天（今天還沒打卡就從昨天）往回數 */
export function streakOf(days: string[] | undefined, today: string): Streak {
  const set = new Set((days ?? []).filter(isDay)), done = set.has(today);
  let d = done ? today : shift(today, -1), count = 0;
  const rested = new Set<string>();
  for (let guard = 0; guard < 2000; guard++) {
    if (set.has(d)) { count++; d = shift(d, -1); continue; }
    // 缺的這一天：前一天有打卡、而且那個月的休息日還沒用，才接得起來。
    // 一段的最前面不算休息；例外是今天還沒打卡、缺的是昨天（今天來練，就接上了）
    const head = count === 0 && !(!done && d === shift(today, -1));
    if (!head && !rested.has(month(d)) && set.has(shift(d, -1))) { rested.add(month(d)); d = shift(d, -1); continue; }
    break;
  }
  return { count, today: done, restUsed: rested.has(month(today)), best: Math.max(count, bestOf(set)), total: set.size };
}

/** 歷來最長的一段（同一套休息日的規則） */
function bestOf(set: Set<string>): number {
  const all = [...set].sort();
  if (!all.length) return 0;
  let best = 0, run = 0, rested = new Set<string>();
  for (let d = all[0]; d <= all[all.length - 1]; d = shift(d, 1)) {
    if (set.has(d)) { run++; best = Math.max(best, run); continue; }
    if (run > 0 && !rested.has(month(d)) && set.has(shift(d, 1))) { rested.add(month(d)); continue; }
    run = 0; rested = new Set();
  }
  return best;
}

/** 一個月的日曆：每一格是那一天，打卡了沒。前面補空格對齊星期（星期日開頭） */
export function monthGrid(days: string[] | undefined, ym: string): (null | { day: string; n: number; done: boolean })[] {
  const set = new Set(days ?? []), first = ym + '-01', lead = new Date(first + 'T00:00:00Z').getUTCDay();
  const cells: (null | { day: string; n: number; done: boolean })[] = Array.from({ length: lead }, () => null);
  for (let d = first, n = 1; month(d) === ym; d = shift(d, 1), n++) cells.push({ day: d, n, done: set.has(d) });
  return cells;
}
