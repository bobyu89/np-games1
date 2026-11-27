// 遊戲化的兩樣：劫影的熟練星、臨床行為的勳章。全部從存檔算，不加存檔欄位。
// 原則：獎勵的是好的臨床習慣（每個方向都有憑據、不掉陷阱、錯了隔幾天回來做對），不是刷場次或分數。
import { CASES, COMPLAINTS } from '../data/index.ts';
import { reviewPlan, missed } from './review.ts';
import type { Save } from './store.ts';
import { streakOf, dayKey } from './streak.ts';
import { TRIAL_PASS } from './progress.ts';
import { weakness, type Weak } from './sprint.ts';

/** 一隻劫影的熟練星：0 還沒碰、1 見習（練過）、2 熟練（最近 3 場以上、掌握度 0.6 以上）、3 精通（最近 5 場、掌握度 0.8 以上） */
export function starsOf(w: Weak): 0 | 1 | 2 | 3 {
  if (!w.n) return w.before ? 1 : 0;
  if (w.n >= 5 && (w.mastery ?? 0) >= 0.8) return 3;
  if (w.n >= 3 && (w.mastery ?? 0) >= 0.6) return 2;
  return 1;
}
export const STAR_NAME = ['還沒碰過', '見習', '熟練', '精通'] as const;
export const starText = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);

/** 十二隻劫影各幾顆星（照主訴的順序） */
export function starsAll(save: Pick<Save, 'plays' | 'cases'>): { complaint: string; name: string; shadow: string; stars: 0 | 1 | 2 | 3; w: Weak }[] {
  const ws = weakness(save);
  return COMPLAINTS.map((m) => { const w = ws.find((x) => x.complaint === m.id)!; return { complaint: m.id, name: m.name, shadow: m.shadow.name, stars: starsOf(w), w }; });
}

export interface Badge { id: string; name: string; how: string; earned(s: Save): boolean }
const formsOf = (complaint: string) => COMPLAINTS.find((m) => m.id === complaint)!.forms.map((f) => f.id);
export const BADGES: Badge[] = [
  { id: 'four-lamps', name: '四燈全排', how: '同一位病人，四個鑑別方向都找到了解讀對的線索。', earned: (s) => CASES.some((c) => { const r = s.cases[c.id]?.reads ?? []; return formsOf(c.complaint).every((f) => r.some((x) => x.form === f)); }) },
  { id: 'no-trap-3', name: '三場不落陷', how: '連續三場（委託或試弓）都沒有掉進那個主訴的陷阱。', earned: (s) => { const p = (s.plays ?? []).filter((x) => x.trapped !== null); return p.some((_, i) => i + 3 <= p.length && p.slice(i, i + 3).every((x) => x.trapped === false)); } },
  { id: 'graduate', name: '錯題畢業', how: '一位錯過的病人，隔 3 天、再隔 7 天都做對了。', earned: (s) => { const plan = reviewPlan(s); const missedIds = new Set((s.plays ?? []).filter(missed).map((p) => p.caseId)); return [...missedIds].some((id) => !plan.some((r) => r.caseId === id)); } },
  { id: 'first-pass', name: '試弓過線', how: '一場試弓達到 ' + TRIAL_PASS + ' 分的及格線。', earned: (s) => s.trials.some((t) => t.score >= TRIAL_PASS) },
  { id: 'calm-80', name: '從容交卷', how: '一場試弓在時間內交卷，而且 80 分以上。', earned: (s) => s.trials.some((t) => !t.timeUp && t.score >= 80) },
  { id: 'week', name: '七日航行', how: '連續打卡七天（每個月可以休息一天）。', earned: (s) => streakOf(s.days, dayKey(Date.now())).best >= 7 },
  { id: 'twelve', name: '十二島都踏上', how: '十二種主訴都至少看過一位病人。', earned: (s) => weakness(s).every((w) => w.n > 0 || w.before > 0) },
  { id: 'master', name: '第一顆精通星', how: '一隻劫影練到精通（★★★）。', earned: (s) => starsAll(s).some((x) => x.stars === 3) },
];

export const badgesOf = (s: Save) => BADGES.filter((b) => b.earned(s));

/** 這一場之後新得到的：升了星的劫影、新的勳章（回顧裡說） */
export function gained(before: Save, after: Save) {
  const b = starsAll(before), a = starsAll(after);
  const stars = a.flatMap((x, i) => (x.stars > b[i].stars ? [{ ...x, from: b[i].stars }] : []));
  const had = new Set(badgesOf(before).map((x) => x.id));
  return { stars, badges: badgesOf(after).filter((x) => !had.has(x.id)) };
}
