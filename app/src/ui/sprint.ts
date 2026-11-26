// 考前衝刺：口試前兩週，大廳多一張計畫卡。
// 每天一場試弓（從你最弱的主訴抽）＋把到期的錯題複習做掉；試弓交卷之後，告訴你十二種主訴哪幾種最弱。
// 全部從存檔裡「最近幾場」（plays）算，不加新的存檔欄位；口試的日期只寫在 exam.ts。
import { CASES, COMPLAINTS, FINALE_ID } from '../data/index.ts';
import type { CaseDef } from '../core/types.ts';
import { EXAM, daysLeft } from './exam.ts';
import type { PlayRecord, Save } from './store.ts';
import { dayKey, shift } from './streak.ts';

/** 口試前幾天開始衝刺 */
export const SPRINT_DAYS = 14;
/** 每一種主訴看最近幾場 */
export const RECENT = 5;

export interface Weak {
  complaint: string;
  name: string;
  /** 最近幾場（最多 RECENT 場） */
  n: number;
  /** 其中診斷對了幾場、掉進陷阱幾場、平均分數 */
  found: number;
  trapped: number;
  score: number | null;
  /** 0 到 1，越低越弱；最近沒有紀錄是 null */
  mastery: number | null;
  /** 委託結案過幾位（最近幾場是 2026-11-23 才開始記的，更早結案的只在這裡） */
  before: number;
}

/** 十二種主訴，最弱的在前面：完全沒碰過的 → 以前結案過、最近沒練的 → 掌握度低的。
 *  掌握度 = 診斷對的比例 50%、沒掉進陷阱的比例 30%、平均分數 20% */
export function weakness(save: Pick<Save, 'plays'> & Partial<Pick<Save, 'cases'>>): Weak[] {
  const byId = new Map(CASES.map((c) => [c.id, c.complaint]));
  const plays = save.plays ?? [];
  const rows = COMPLAINTS.map((m) => {
    const mine = plays.filter((p) => byId.get(p.caseId) === m.id).sort((a, b) => b.at - a.at).slice(0, RECENT);
    const n = mine.length, found = mine.filter((p) => p.found).length, trapped = mine.filter((p) => p.trapped === true).length;
    const score = n ? Math.round(mine.reduce((k, p) => k + p.score, 0) / n) : null;
    const mastery = n ? 0.5 * (found / n) + 0.3 * (1 - trapped / n) + 0.2 * (score! / 100) : null;
    const before = CASES.filter((c) => c.complaint === m.id && save.cases?.[c.id]).length;
    return { complaint: m.id, name: m.name, n, found, trapped, score, mastery, before };
  });
  const tier = (w: Weak) => (w.mastery !== null ? 2 : w.before ? 1 : 0), order = (w: Weak) => COMPLAINTS.findIndex((m) => m.id === w.complaint);
  return rows.sort((a, b) => tier(a) - tier(b) || (a.mastery ?? 0) - (b.mastery ?? 0) || order(a) - order(b));
}

/** 一句話說它為什麼弱 */
export function whyWeak(w: Weak): string {
  if (!w.n) return w.before ? '最近沒練過（之前結案 ' + w.before + ' 位）' : '還沒練過';
  const parts = ['診斷對 ' + w.found + '／' + w.n];
  if (w.trapped) parts.push('掉進陷阱 ' + w.trapped + ' 次');
  parts.push('平均 ' + w.score + ' 分');
  return parts.join('・');
}

/** 衝刺用的抽題：從最弱的三種主訴裡抽一位。同一種主訴裡，沒遇過的先、不重複上一場。r 是 0 到 1 的亂數 */
export function pickSprint(save: Pick<Save, 'plays' | 'cases' | 'trials'>, r: number): CaseDef {
  const weak = weakness(save).slice(0, 3);
  const k = Math.min(2, Math.floor(Math.min(0.999999, Math.max(0, r)) * 3));
  const complaint = weak[k].complaint, last = save.trials[0]?.caseId;
  const pool = CASES.filter((c) => c.complaint === complaint && c.id !== FINALE_ID);
  const seen = (c: CaseDef) => !!save.cases[c.id] || save.trials.some((t) => t.caseId === c.id) || (save.plays ?? []).some((p) => p.caseId === c.id);
  const fresh = pool.filter((c) => !seen(c) && c.id !== last), rest = pool.filter((c) => c.id !== last);
  const from = fresh.length ? fresh : rest.length ? rest : pool;
  // 同一個 r 再拿來挑病人：先用掉選主訴的那一段，剩下的比例拿來挑
  const r2 = (Math.min(0.999999, Math.max(0, r)) * 3) % 1;
  return from[Math.min(from.length - 1, Math.floor(r2 * from.length))];
}

export interface SprintDay { day: string; trial: boolean; state: 'past' | 'today' | 'later' | 'exam' }
export interface Sprint {
  daysLeft: number;
  /** 衝刺開始那天到口試那天，每一天有沒有考一場試弓 */
  days: SprintDay[];
  /** 今天考過試弓了沒 */
  trialToday: boolean;
  /** 衝刺開始之後，有考試弓的天數 */
  trialDays: number;
}

/** 現在是不是衝刺期間。口試前 SPRINT_DAYS 天到口試前一天；口試當天和之後不顯示（null） */
export function sprintOf(save: Pick<Save, 'plays'>, now: Date = new Date()): Sprint | null {
  const left = daysLeft(now);
  if (left === null || left < 1 || left > SPRINT_DAYS) return null;
  const today = dayKey(now.getTime()), start = shift(EXAM.date, -SPRINT_DAYS);
  const trialOn = new Set((save.plays ?? []).filter((p: PlayRecord) => p.trial).map((p) => dayKey(p.at)));
  const days: SprintDay[] = [];
  for (let d = start; d <= EXAM.date; d = shift(d, 1)) days.push({ day: d, trial: trialOn.has(d), state: d === EXAM.date ? 'exam' : d < today ? 'past' : d === today ? 'today' : 'later' });
  return { daysLeft: left, days, trialToday: trialOn.has(today), trialDays: days.filter((d) => d.trial).length };
}
