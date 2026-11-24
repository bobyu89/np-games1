// 刻意練習：一次只練一個環節，題目短、馬上有回饋、可以一直重來。
// 題目都從你看過的病人裡出（委託結過案或考過試弓的），所以不會先劇透還沒遇到的病人。
// 三種：線索解讀（這條線索讓哪個診斷更像或比較不像）、問題摘要（一句話說出問題）、回報的評估（向醫師說你認為是什麼狀況）。
// 不計分、不寫圖鑑、不算打卡；結果只在這一輪顯示。
import type { CaseDef, Choice, Clue, Tell } from '../core/types.ts';
import { CASES } from '../data/index.ts';
import type { Save } from './store.ts';

export type DrillKind = 'read' | 'summary' | 'sbar';
export const DRILLS: { kind: DrillKind; name: string; what: string; n: number }[] = [
  { kind: 'read', name: '線索解讀', what: '一條線索，它讓哪一個診斷更像、哪一個比較不像？', n: 6 },
  { kind: 'summary', name: '問題摘要', what: '看重點線索，挑出最好的那一句問題摘要。', n: 4 },
  { kind: 'sbar', name: '回報的評估', what: '向值班醫師回報時，「你認為是什麼狀況」那一句怎麼說。', n: 4 },
];

export type ReadItem = { kind: 'read'; c: CaseDef; clue: Clue; fresh: boolean };
export type PickItem = { kind: 'summary' | 'sbar'; c: CaseDef; options: (Choice & { score: number })[]; best: string[] };
export type DrillItem = ReadItem | PickItem;

/** 可以出題的病人：委託結過案、或試弓考過的 */
export function drillCases(save: Pick<Save, 'cases' | 'trials' | 'plays'>): CaseDef[] {
  const seen = new Set([...Object.keys(save.cases), ...save.trials.map((t) => t.caseId), ...(save.plays ?? []).map((p) => p.caseId)]);
  return CASES.filter((c) => seen.has(c.id));
}

/** 可以重現的亂數（同一個種子出同一組題目，測試用得到） */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle<T>(list: T[], r: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const bestOf = (opts: { id: string; score: number }[]) => { const top = Math.max(...opts.map((o) => o.score)); return opts.filter((o) => o.score === top).map((o) => o.id); };

/** 出一輪題目。線索解讀先出你還沒解讀對過的線索；同一位病人盡量不連著出 */
export function buildDrill(kind: DrillKind, save: Pick<Save, 'cases' | 'trials' | 'plays'>, seed: number, n = DRILLS.find((d) => d.kind === kind)!.n): DrillItem[] {
  const r = rng(seed), cases = drillCases(save);
  if (kind === 'read') {
    const all = cases.flatMap((c) => c.clues.filter((k) => k.tell).map((clue) => ({ kind: 'read' as const, c, clue, fresh: !save.cases[c.id]?.reads.some((x) => x.clue === clue.id) })));
    const order = [...shuffle(all.filter((x) => x.fresh), r), ...shuffle(all.filter((x) => !x.fresh), r)];
    // 同一位病人一輪最多兩題
    const out: ReadItem[] = [];
    for (const x of order) { if (out.length >= n) break; if (out.filter((k) => k.c.id === x.c.id).length < 2) out.push(x); }
    for (const x of order) { if (out.length >= n) break; if (!out.includes(x)) out.push(x); }
    return shuffle(out, r);
  }
  return shuffle(cases, r).slice(0, n).map((c) => {
    const options = shuffle(kind === 'summary' ? c.summaries : c.sbar.assessments, r);
    return { kind, c, options, best: bestOf(options) };
  });
}

/** 線索解讀對不對：主要的解讀，或寫在 alsoOk 的其他解讀 */
export const readOk = (clue: Clue, pick: Tell) => [clue.tell!, ...(clue.alsoOk ?? [])].some((t) => t.form === pick.form && t.dir === pick.dir);

/** 題目上方的一行：這位病人是誰 */
export const stemOf = (c: CaseDef) => c.patient.name + '，' + c.patient.age + ' 歲' + c.patient.sex + '性，' + c.complaintName + '。';

/** 問題摘要和回報題給的資料：重點的有、沒有，和生命徵象 */
export function factsOf(c: CaseDef): { pos: string[]; neg: string[]; vitals: string } {
  const v = c.vitals.base;
  return {
    pos: c.clues.filter((k) => k.key && k.kind !== 'neg' && k.id !== 'c-vitals').slice(0, 8).map((k) => k.text),
    neg: c.clues.filter((k) => k.key && k.kind === 'neg').slice(0, 4).map((k) => k.text),
    vitals: '血壓 ' + v.bp + '、心跳 ' + v.hr + '、呼吸 ' + v.rr + '、血氧 ' + v.spo2 + '%、體溫 ' + v.bt + '°C',
  };
}
