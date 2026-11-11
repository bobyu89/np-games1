// 病例檢查器：寫病例的人最常犯的錯是「指到不存在的東西」。上線前每個病例都要過這一關。
import type { CaseDef } from './types.ts';

export function validateCase(c: CaseDef): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  const uniq = (kind: string, list: { id: string }[]) => list.forEach((k) => { if (ids.has(k.id)) errs.push(kind + ' 的代號重複：' + k.id); ids.add(k.id); });
  uniq('線索', c.clues); uniq('問題', c.questions); uniq('評估', c.exams); uniq('檢查', c.tests); uniq('假設', c.hypotheses);
  uniq('摘要', c.summaries); uniq('回報的評估', c.sbar.assessments); uniq('回報的請求', c.sbar.requests); uniq('說明', c.explain); uniq('提示', c.hints);

  const clue = new Set(c.clues.map((k) => k.id)), hyp = new Set(c.hypotheses.map((h) => h.id)), used = new Set<string>(['c-vitals']);
  const needClue = (where: string, id?: string) => { if (id === undefined) return; used.add(id); if (!clue.has(id)) errs.push(where + ' 指到不存在的線索：' + id); };
  c.questions.forEach((q) => needClue('問題 ' + q.id, q.clue));
  c.exams.forEach((e) => needClue('評估 ' + e.id, e.clue));
  c.tests.forEach((t) => {
    needClue('檢查 ' + t.id, t.clue);
    if (t.kind === 'record' && !t.result) errs.push('檢查 ' + t.id + ' 是已有的資料，卻沒有內容');
    if (t.kind === 'order' && t.delay === undefined && !t.pending) errs.push('檢查 ' + t.id + ' 等不到結果，卻沒有寫等待的說明');
    if (t.kind === 'order' && t.delay !== undefined && !t.result) errs.push('檢查 ' + t.id + ' 有結果時間，卻沒有結果');
  });
  c.explain.forEach((e) => needClue('說明 ' + e.id, e.needsClue));
  c.hypotheses.forEach((h) => [...h.support, ...h.against].forEach((id) => { if (!clue.has(id)) errs.push('假設 ' + h.id + ' 指到不存在的線索：' + id); }));
  c.clues.forEach((k) => { if (!used.has(k.id)) errs.push('線索 ' + k.id + ' 沒有任何行動拿得到'); });

  if (!hyp.has(c.answer.likely)) errs.push('最可能的假設不存在：' + c.answer.likely);
  Object.keys(c.answer.exclude).forEach((id) => { if (!hyp.has(id)) errs.push('要排除的假設不存在：' + id); });
  if (!c.tests.some((t) => t.id === c.timeline.ecgTest)) errs.push('時間表指到不存在的檢查：' + c.timeline.ecgTest);
  if (!(c.timeline.worsenAt < c.timeline.stepInAt)) errs.push('病況變差的時間要早於岑禾接手的時間');
  if (!c.questions.some((q) => q.id === 'q-intro')) errs.push('少了自我介紹（q-intro）');
  if (!c.clues.some((k) => k.id === 'c-vitals')) errs.push('少了生命徵象的線索（c-vitals）');
  if (!c.summaries.some((k) => k.score === 5)) errs.push('問題摘要沒有滿分的選項');
  if (!c.sbar.assessments.some((k) => k.score === 2)) errs.push('回報的評估沒有滿分的選項');
  c.debrief.teaching.forEach((t) => { if (!c.debrief.references.some((r) => r.id === t.ref)) errs.push('教學重點指到不存在的文獻：' + t.ref); });
  c.debrief.references.forEach((r) => { if (!/^10\.\d{4,}\//.test(r.doi)) errs.push('文獻 ' + r.id + ' 的 DOI 格式不對'); });
  ['h-call', 'h-vitals', 'h-ecg', 'h-negatives', 'h-report', 'h-reassess', 'h-board', 'h-explain', 'h-close'].forEach((id) => { if (!c.hints.some((h) => h.id === id)) errs.push('少了提示：' + id); });
  return errs;
}
