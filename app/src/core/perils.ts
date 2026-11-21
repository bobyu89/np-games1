// 劫的回顧：每一種劫影對到一段海上的試煉，也就是那個主訴最容易掉進的推理陷阱。
// 結案之後，照「這一場實際做了什麼」判斷有沒有被困住。不計分，只是讓人把十二個陷阱記住。
// 這裡在結案之後才用，可以看答案；判斷全部從現有的紀錄來，不需要新的病例內容。
import type { CaseDef, Session } from './types.ts';
import { PERILS, type Peril } from '../data/odyssey.ts';

export interface PerilCheck { peril: Peril; trapped: boolean; why: string }

const partsDone = (c: CaseDef, s: Session) => s.examined.map((k) => c.exams.find((e) => e.id === k.id)?.part);
const badRequest = (c: CaseDef, s: Session) => !!s.report && s.report.r.some((id) => c.sbar.requests.find((q) => q.id === id)?.ok === false);
const askedIn = (c: CaseDef, s: Session, g: string, skip?: string) => c.questions.filter((q) => q.group === g && q.id !== skip && s.asked.includes(q.id)).length;

/** 每一劫：被困住的話，是哪一個動作。回傳 null 表示過了 */
const RULES: Record<string, (c: CaseDef, s: Session) => string | null> = {
  'chest-pain': (_c, s) => (!s.board.likely ? '這一場沒有下診斷。' : s.board.exclude.length ? null : '下診斷的時候，「還要排除」一個都沒有選。'),
  dyspnea: (c, s) => (!s.report ? '這一場沒有向醫師回報，也就沒有說出你要哪些處置。' : badRequest(c, s) ? '回報的時候，你提了一項這位病人不該要的處置。' : null),
  abdomen: (c, s) => {
    const all = c.questions.filter((q) => q.group === 'cc').length, need = Math.min(6, all), got = askedIn(c, s, 'cc');
    return got >= need ? null : '主訴的細節只問了 ' + got + ' 題（至少要 ' + need + ' 題）：痛從哪裡開始、怎麼變，還沒問完。';
  },
  fever: (c, s) => (badRequest(c, s) ? '回報的時候，你提了一項還沒有根據、或對這位病人不對的處置。' : !s.ordered.length ? '這一場沒有提出任何檢查，就結案了。' : null),
  headache: (c, s) => {
    const best = Math.max(...c.summaries.map((k) => k.score)), mine = c.summaries.find((k) => k.id === s.board.summary);
    return !mine ? '這一場沒有選摘要。' : mine.score >= best ? null : '你選的摘要不是最好的那一句：它順著好聽的說法走，少了這一次真正的樣子。';
  },
  'back-pain': (c, s) => {
    if (c.timeline.worsenAfter !== undefined) {
      if (s.calledAt === null) return '這一位會變差，你沒有通報。';
      if (s.worsenedAt !== null && s.calledAt >= s.worsenedAt) return '你是等他變差了才通報的。';
      return null;
    }
    return s.vitalsLog.length ? null : '你沒有量他的生命徵象，就信了「還撐得住」。';
  },
  'leg-pain': (c, s) => {
    const n = partsDone(c, s).filter((p) => p === '四肢').length;
    if (n < 3) return '四肢只檢查了 ' + n + ' 項：沒有把鞋襪脫掉、兩邊比一比。';
    return s.examined.some((k) => !k.explained) ? '有幾項評估，動手之前沒有先向病人說明。' : null;
  },
  swelling: (c, s) => {
    const p = partsDone(c, s), miss = [
      ...(p.includes('心臟') || p.includes('頭頸') ? [] : ['心臟和頸靜脈']), ...(p.includes('腹部') ? [] : ['肚子']), ...(p.filter((x) => x === '四肢').length >= 2 ? [] : ['兩隻腳的比較'])];
    return miss.length ? '水的三條路，你沒有看：' + miss.join('、') + '。' : null;
  },
  excreta: (c, s) => (!c.questions.some((q) => q.id === 'q-concern') || s.asked.includes('q-concern') ? null : '你沒有問他最擔心的是什麼。'),
  rash: (c, s) => {
    if (!s.vitalsLog.some((t) => s.dxAt === null || t <= s.dxAt)) return '下診斷之前，你沒有量生命徵象。';
    const n = partsDone(c, s).filter((p) => p && p !== '皮膚').length;
    return n >= 2 ? null : '你只看了皮膚；疹子以外的地方，看了不到兩處。';
  },
  'weight-loss': (c, s) => { const n = askedIn(c, s, 'hx', 'q-concern'); return n >= 4 ? null : '過去病史、用藥和生活，只問了 ' + n + ' 題。'; },
  paresthesia: (c, s) => {
    if (s.board.likely !== c.answer.truth) return '最可能的診斷不對：麻的位置和時間，還沒問到能分出是哪裡。';
    const lost = Object.keys(c.answer.exclude).filter((f) => !s.board.exclude.includes(f) || !s.reads.some((r) => r.form === f && r.ok));
    return lost.length ? '還要排除的方向，有 ' + lost.length + ' 個沒有排、或沒有找到談它的線索。' : null;
  },
};

/** 這一位病人是哪一劫，你這一場有沒有被困住。不認得的主訴回傳 null */
export function perilOf(c: CaseDef, s: Session): PerilCheck | null {
  const peril = PERILS[c.complaint], rule = RULES[c.complaint];
  if (!peril || !rule) return null;
  const why = rule(c, s);
  return { peril, trapped: why !== null, why: why ?? peril.pass };
}
