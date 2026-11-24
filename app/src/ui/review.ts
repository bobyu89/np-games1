// 錯題的間隔複習：一位病人診斷錯了、或是掉進了那個主訴的陷阱，大約 3 天後回來考一次；
// 那一次做對了，再隔 7 天回來一次；再對，就畢業。中間又錯了，從頭算。
// 全部從「最近幾場」（save.plays）算出來，不另外存，所以登入同步也跟著走。
// 太早重考（間隔還沒到）不算一次複習：間隔本身就是練習的一部分。
import type { PlayRecord, Save } from './store.ts';
import { dayKey, shift } from './streak.ts';

/** 第一次、第二次複習的間隔（天） */
export const REVIEW_GAPS = [3, 7] as const;

/** 這一場算錯：診斷沒對，或掉進了陷阱 */
export const missed = (p: Pick<PlayRecord, 'found' | 'trapped'>) => !p.found || p.trapped === true;

export interface ReviewItem {
  caseId: string;
  /** 最近一次錯的那一天 */
  missedOn: string;
  /** 第幾次複習（1 或 2） */
  round: 1 | 2;
  /** 哪一天到期（YYYY-MM-DD） */
  due: string;
  /** 為什麼要回來：診斷錯、掉進陷阱，或兩個都有 */
  why: { wrong: boolean; trapped: boolean };
  /** 錯在試弓（就用試弓重考），還是委託（就重接這張委託） */
  trial: boolean;
}

/** 每一位錯過、還沒畢業的病人，下一次該哪一天複習。照到期日排，早的在前面 */
export function reviewPlan(save: Pick<Save, 'plays'>): ReviewItem[] {
  const plays = [...(save.plays ?? [])].sort((a, b) => a.at - b.at);
  const ids = [...new Set(plays.map((p) => p.caseId))];
  const out: ReviewItem[] = [];
  for (const id of ids) {
    const mine = plays.filter((p) => p.caseId === id);
    const last = mine.map(missed).lastIndexOf(true);
    if (last < 0) continue;
    const miss = mine[last], missedOn = dayKey(miss.at);
    let anchor = missedOn, round = 0;
    for (const p of mine.slice(last + 1)) {
      if (round < REVIEW_GAPS.length && dayKey(p.at) >= shift(anchor, REVIEW_GAPS[round])) { anchor = dayKey(p.at); round++; }
    }
    if (round >= REVIEW_GAPS.length) continue;
    out.push({ caseId: id, missedOn, round: (round + 1) as 1 | 2, due: shift(anchor, REVIEW_GAPS[round]), why: { wrong: !miss.found, trapped: miss.trapped === true }, trial: miss.trial });
  }
  return out.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
}

/** 今天（含以前）到期的 */
export const reviewDue = (save: Pick<Save, 'plays'>, today: string) => reviewPlan(save).filter((r) => r.due <= today);
