// 請教老醫生：每一位只看「玩家這一場做了什麼、還沒做什麼」，不看這位病人的答案。
// 每一位有自己先提的順序，也有永遠不提的那幾類（他的盲點）。他沒提的，不代表你做完了：回顧會問你看出來了沒有。
import type { CaseDef, Session } from './types.ts';
import { ELDERS, elderOf, type Elder, type Gap } from '../data/islands.ts';

const inGroup = (c: CaseDef, g: string) => c.questions.filter((q) => q.group === g);
const askedIn = (c: CaseDef, s: Session, g: string) => inGroup(c, g).filter((q) => s.asked.includes(q.id)).length;

/**
 * 這一刻還沒做的事，照看病人的順序排。只讀這一場的行動和這個主訴共用的選單，
 * 不讀診斷、危險標記、關鍵線索或該做的檢查：換一位病人，同樣的行動得到同樣的缺口。
 */
export function gaps(c: CaseDef, s: Session): Gap[] {
  const out: Gap[] = [];
  const has = (id: string) => c.questions.some((q) => q.id === id);
  if (askedIn(c, s, 'open') < inGroup(c, 'open').length) out.push('open');
  if (askedIn(c, s, 'cc') < Math.min(6, inGroup(c, 'cc').length)) out.push('cc');
  if (inGroup(c, 'hx').filter((q) => q.id !== 'q-concern' && s.asked.includes(q.id)).length < 4) out.push('hx');
  if (has('q-concern') && !s.asked.includes('q-concern')) out.push('concern');
  if (askedIn(c, s, 'ros') < 3) out.push('ros');
  if (s.vitalsSeen === null) out.push('vitals');
  if (s.examined.length < 4) out.push('exam');
  if (s.examined.some((k) => !k.explained)) out.push('explainFirst');
  if (s.phase >= 3 && !s.board.likely) out.push('board');
  if (s.worsenedAt !== null && !s.vitalsLog.some((t) => t >= s.worsenedAt!)) out.push('recheck');
  if (s.dxAt !== null) {
    if (s.calledAt === null && !s.ordered.length && !s.report) out.push('urgency');
    if (!s.ordered.length) out.push('tests');
    if (s.board.exclude.some((id) => !s.reads.some((r) => r.form === id))) out.push('exclude');
    if (!s.report) out.push('report');
    if (!s.explained) out.push('tell');
  }
  return out;
}

export interface Consult { by: string; t: number; said: Gap | null; open: Gap[]; missed: Gap[] }

/** 這位老醫生這一刻會說什麼，和他漏了什麼（還沒做、可是在他不提的那幾類裡） */
export function consult(e: Elder, c: CaseDef, s: Session): { text: string; record: Consult } {
  const open = gaps(c, s), said = e.order.find((g) => open.includes(g) && e.say[g]) ?? null;
  const missed = open.filter((g) => e.never.includes(g));
  const fill = (t: string) => t.replaceAll('{who}', c.patient.name);
  return { text: fill(said ? e.say[said]! : e.none), record: { by: e.id, t: s.time, said, open, missed } };
}

/** 有哪幾位老醫生可以請教：已經去過那座島的那幾位（第幾章開了，就見過那一章的長老） */
export const eldersMet = (chapterOpen: (n: number) => boolean) => ELDERS.filter((e) => chapterOpen(elderChapter(e.id))).map((e) => e.id);
const CHAPTER: Record<string, number> = { nie: 2, lu: 2, guan: 3, chu: 4, ge: 5 };
/** 第幾章開了之後，病室裡才請得到這一位（會首埃普是第一章走完，跟著巡診船一起出海之後） */
export const elderChapter = (id: string) => CHAPTER[id];

export interface ConsultQuestion { by: string; name: string; t: number; answer: Gap; options: Gap[]; blind: string; pronoun: string }

/**
 * 回顧裡的那一題：「你請教的那一位，那時候沒提的是哪一項？」
 * 取最後一次「他有漏」的請教。選項是他漏的那一項，加上兩項那時候你已經做完的（所以選它們一定不對）。
 */
export function consultQuestion(s: Session): ConsultQuestion | null {
  const list = (s.consults ?? []).filter((k) => k.missed.length);
  const k = list[list.length - 1] as Consult | undefined;
  if (!k) return null;
  const e = elderOf(k.by), answer = k.missed[0];
  const ALL: Gap[] = ['open', 'cc', 'hx', 'concern', 'ros', 'vitals', 'exam', 'board', 'tests', 'report', 'tell'];
  const done = ALL.filter((g) => !k.open.includes(g) && g !== answer).slice(0, 2);
  if (done.length < 2) return null;
  // 固定的順序：照請教的時間挑答案放第幾個，不用亂數
  const at = k.t % 3, options = [...done];
  options.splice(at, 0, answer);
  return { by: e.id, name: e.name, t: k.t, answer, options, blind: e.blind, pronoun: e.pronoun };
}
