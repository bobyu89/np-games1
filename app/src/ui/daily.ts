// 今日之劫：哪一天是哪一位病人、今天做了沒有。日期照這台裝置的日期。
import { DAILY } from '../data/daily.ts';
import { CASES, FINALE_ID, caseById } from '../data/index.ts';
import type { CaseDef } from '../core/types.ts';
import type { Save } from './store.ts';
import { dayKey } from './streak.ts';

/** 這一天的病人 */
export function dailyCase(day: string): CaseDef {
  const hit = DAILY.find(([d]) => d === day);
  if (hit) return caseById(hit[1]);
  const pool = CASES.filter((c) => c.id !== FINALE_ID);
  let h = 0; for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}

/** 今天的今日之劫做了沒有：今天有一場（委託或試弓）是這一位 */
export function dailyDone(save: Pick<Save, 'plays'>, day: string): boolean {
  const c = dailyCase(day);
  return (save.plays ?? []).some((p) => p.caseId === c.id && dayKey(p.at) === day);
}
