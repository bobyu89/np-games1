// 長期的推進：委託怎麼解鎖、故事什麼時候往下走、圖鑑怎麼被寫回來、階級怎麼升。
// 全部從「玩過哪些病例、解讀對哪些線索」算出來，沒有另外的經驗值。
import type { CaseDef, Score, Session } from '../core/types.ts';
import type { ComplaintDef } from '../core/module.ts';
import { harvest } from '../core/scoring.ts';
import { CASES } from '../data/index.ts';
import type { Line } from './Talk.tsx';
import type { CaseRecord, Save } from './store.ts';

/** 委託板上的一張委託。needs：要先完成哪一張才會出現 */
export interface Quest { caseId: string; chapter: number; needs?: string }
export const QUESTS: Quest[] = [{ caseId: 'c01a', chapter: 1 }, { caseId: 'c01b', chapter: 1, needs: 'c01a' }];
export const unlocked = (q: Quest, s: Save) => !q.needs || !!s.cases[q.needs];

/** 故事的一段。條件成立、而且還沒看過，回到公會的時候就會播 */
export interface Beat { id: string; title: string; when(s: Save): boolean; lines: Line[] }
export const BEATS: Beat[] = [
  { id: 'prologue', title: '序章　遺失的一頁', when: () => true, lines: [
    { who: 'sys', text: '霧港。霧脈公會的大廳。' },
    { who: 'mo', text: '檔案室淹水了。圖鑑只救回症影的外形，底下寫的東西都糊掉了。' },
    { who: 'mentor', text: '所以從今天起，每一張委託都要重新看。你來得正好，見習生。' },
    { who: 'mentor', text: '症影只告訴你「哪裡不舒服」，不告訴你「為什麼」。為什麼，要你自己問出來。' },
    { who: 'mentor', text: '板子上那張蓋了紅蠟的，是剛送來的。去看看吧。' },
  ] },
  { id: 'ch1-second', title: '第一章　鐘聲之前', when: (s) => !!s.cases.c01a, lines: [
    { who: 'mo', text: '鐵翅蛾那一頁回來了一半。舊索引上只寫了一行：「鐵翅蛾，心」。' },
    { who: 'mentor', text: '一隻症影只配一個答案。那本索引就是這樣害人的。' },
    { who: 'mentor', text: '碼頭又送來一位，同事說「跟林秋那天一樣」。你去看看，是不是真的一樣。' },
  ] },
  { id: 'ch1-end', title: '第一章　完', when: (s) => !!s.cases.c01a && !!s.cases.c01b, lines: [
    { who: 'mo', text: '兩個人，同一隻蛾，兩個真身。舊索引那一行，我劃掉了。' },
    { who: 'mentor', text: '這一頁現在是你寫的：哪些線索讓它更像，哪些讓它比較不像。' },
    { who: 'mentor', text: '第一章到這裡。下一頁是別的症影，還在整理，好了會貼到委託板上。' },
    { who: 'sys', text: '你升為「巡診專科護理師」。' },
  ] },
];
export const nextBeat = (s: Save) => BEATS.find((b) => !s.beats.includes(b.id) && b.when(s));

export const rankOf = (s: Save) => (QUESTS.filter((q) => q.chapter === 1).every((q) => s.cases[q.caseId]) ? '巡診專科護理師' : '見習專科護理師');

/** 把一場對局的結果併進存檔 */
export function record(save: Save, c: CaseDef, session: Session, score: Score, seconds: number, takeaway: string | null): Save {
  const old = save.cases[c.id], h = harvest(c, session), total = Math.round(score.total), better = !old || total > old.best;
  const reads = [...(old?.reads ?? [])];
  h.reads.forEach((r) => { if (!reads.some((k) => k.clue === r.clue)) reads.push(r); });
  const rec: CaseRecord = { best: better ? total : old.best, safety: better ? score.safety : old.safety, plays: (old?.plays ?? 0) + 1, seconds, found: !!old?.found || h.found, concern: !!old?.concern || h.concern, reads };
  const takeaways = takeaway ? [takeaway, ...save.takeaways.filter((t) => t !== takeaway)].slice(0, 5) : save.takeaways;
  return { ...save, cases: { ...save.cases, [c.id]: rec }, takeaways };
}

/** 這一場新寫進圖鑑的線索（之前沒有解讀對過的） */
export function newReads(save: Save, c: CaseDef, session: Session) {
  const had = save.cases[c.id]?.reads ?? [];
  return harvest(c, session).reads.filter((r) => !had.some((k) => k.clue === r.clue));
}

/** 圖鑑的一頁：一隻症影、四個真身、你在不同病人身上解讀對的線索 */
export function codexOf(m: ComplaintDef, save: Save) {
  const cases = CASES.filter((c) => c.complaint === m.id);
  const forms = m.forms.map((f) => {
    const seenIn = cases.filter((c) => c.answer.truth === f.id && save.cases[c.id]?.found).map((c) => c.patient.name);
    const reads = cases.flatMap((c) => (save.cases[c.id]?.reads ?? []).filter((r) => r.form === f.id).map((r) => ({ ...r, who: c.patient.name })));
    return { form: f, seenIn, reads, known: seenIn.length > 0 || reads.length > 0 };
  });
  const total = cases.reduce((n, c) => n + c.clues.filter((k) => k.tell).length, 0), got = cases.reduce((n, c) => n + (save.cases[c.id]?.reads.length ?? 0), 0);
  const people = cases.filter((c) => save.cases[c.id]).map((c) => ({ c, rec: save.cases[c.id] }));
  const percent = Math.round(100 * (0.4 * (people.length / cases.length) + 0.3 * (forms.filter((f) => f.known).length / forms.length) + 0.3 * (total ? got / total : 0)));
  return { cases, forms, people, percent, got, total };
}
