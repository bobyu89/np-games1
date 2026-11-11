// 病例檢查器：寫病例的人最常犯的錯是「指到不存在的東西」和「漏了一塊」。每個病例上線前都要過這一關。
import type { CaseDef } from './types.ts';

export function validateCase(c: CaseDef): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  const uniq = (kind: string, list: { id: string }[]) => list.forEach((k) => { if (ids.has(k.id)) errs.push(kind + ' 的代號重複：' + k.id); ids.add(k.id); });
  uniq('線索', c.clues); uniq('問題', c.questions); uniq('評估', c.exams); uniq('檢查', c.tests); uniq('真身', c.forms);
  uniq('摘要', c.summaries); uniq('回報的評估', c.sbar.assessments); uniq('回報的請求', c.sbar.requests); uniq('說明', c.explain);

  const clue = new Set(c.clues.map((k) => k.id)), form = new Set(c.forms.map((f) => f.id)), test = new Set(c.tests.map((t) => t.id)), used = new Set<string>(['c-vitals']);
  const needClue = (where: string, id?: string) => { if (id === undefined) return; used.add(id); if (!clue.has(id)) errs.push(where + ' 指到不存在的線索：' + id); };
  c.questions.forEach((q) => { needClue('問題 ' + q.id, q.clue); if (!q.answer) errs.push('問題 ' + q.id + ' 沒有回答'); });
  c.exams.forEach((e) => { needClue('評估 ' + e.id, e.clue); if (!e.finding) errs.push('評估 ' + e.id + ' 沒有結果'); });
  c.tests.forEach((t) => {
    needClue('檢查 ' + t.id, t.clue);
    if (t.kind === 'record' && !t.result) errs.push('檢查 ' + t.id + ' 是已有的資料，卻沒有內容');
    if (t.kind === 'order' && t.delay === undefined && !t.pending) errs.push('檢查 ' + t.id + ' 等不到結果，卻沒有寫等待的說明');
    if (t.kind === 'order' && t.delay !== undefined && !t.result) errs.push('檢查 ' + t.id + ' 有結果時間，卻沒有結果');
  });
  c.explain.forEach((e) => needClue('說明 ' + e.id, e.needsClue));
  c.clues.forEach((k) => {
    if (!used.has(k.id)) errs.push('線索 ' + k.id + ' 沒有任何行動拿得到');
    [k.tell, ...(k.alsoOk ?? [])].forEach((t) => { if (t && !form.has(t.form)) errs.push('線索 ' + k.id + ' 的解讀指到不存在的真身：' + t.form); });
    if (k.tell && !k.why) errs.push('線索 ' + k.id + ' 要玩家解讀，卻沒有寫為什麼');
    if (!k.tell && k.alsoOk) errs.push('線索 ' + k.id + ' 只寫了「也算對」，沒有寫主要的解讀');
  });

  // 真身：固定四個；真身和要排除的都要存在
  if (c.forms.length !== 4) errs.push('一個主訴要有四個真身，現在有 ' + c.forms.length + ' 個');
  if (!form.has(c.answer.truth)) errs.push('真身不存在：' + c.answer.truth);
  Object.keys(c.answer.exclude).forEach((id) => { if (!form.has(id)) errs.push('要排除的真身不存在：' + id); if (id === c.answer.truth) errs.push('真身不能同時列在要排除的裡面'); });
  const tells = c.clues.filter((k) => k.tell);
  if (tells.length < c.readsNeeded) errs.push('要解讀的線索只有 ' + tells.length + ' 條，不夠拿滿（需要 ' + c.readsNeeded + ' 條）');
  if (!tells.some((k) => k.tell!.form === c.answer.truth && k.tell!.dir === 1)) errs.push('沒有任何線索支持真身');

  // 安全行動
  const tl = c.timeline;
  if (tl.worsenAt !== undefined && tl.stepInAt !== undefined && !(tl.worsenAt < tl.stepInAt)) errs.push('病況變差的時間要早於岑禾接手的時間');
  if (!c.safety.length) errs.push('沒有宣告任何安全行動');
  if (Math.abs(c.safety.reduce((n, r) => n + r.points, 0) - 9) > 0.001) errs.push('安全行動的分數加起來要是 9 分');
  c.safety.forEach((r) => {
    if (r.type === 'call' && tl.worsenAt === undefined) errs.push('要求在變差之前通報，卻沒有寫變差的時間');
    if (r.type === 'call' && (!c.vitals.worse || !c.lines.worsen || !c.lines.stepIn)) errs.push('會變差的病例要寫變差後的生命徵象、病人的話和岑禾接手的話');
    if (r.type === 'order' && !test.has(r.test)) errs.push('安全行動指到不存在的檢查：' + r.test);
    if (r.type === 'exclude') r.forms.forEach((f) => {
      if (!form.has(f)) errs.push('安全行動要排除不存在的真身：' + f);
      else if (!tells.some((k) => k.tell!.form === f && k.tell!.dir === -1)) errs.push('要求排除「' + f + '」，卻沒有任何線索能讓它比較不像');
    });
    if (r.type === 'explain' && !c.explain.some((e) => e.id === r.id && e.ok)) errs.push('安全行動指到不存在或不適合的說明：' + r.id);
    if (r.type === 'calm' && tl.worsenAt !== undefined) errs.push('會變差的病例不能要求不敲鐘');
  });
  c.sbar.requests.forEach((k) => { if (k.orders && !test.has(k.orders)) errs.push('回報的請求指到不存在的檢查：' + k.orders); });

  if (!c.questions.some((q) => q.id === 'q-intro')) errs.push('少了自我介紹（q-intro）');
  if (!c.summaries.some((k) => k.score === 5)) errs.push('問題摘要沒有滿分的選項');
  if (!c.sbar.assessments.some((k) => k.score === 2)) errs.push('回報的評估沒有滿分的選項');
  if (c.sbar.requests.filter((k) => k.ok).length < 2) errs.push('回報的請求至少要有兩個適合的選項');
  if (c.explain.filter((e) => e.ok && !e.concern).length < 3) errs.push('說明至少要有三句適合的話');
  if (!c.explain.some((e) => e.concern && e.ok)) errs.push('說明裡少了回應病人擔心的那一句');
  c.debrief.teaching.forEach((t) => { if (!c.debrief.references.some((r) => r.id === t.ref)) errs.push('教學重點指到不存在的文獻：' + t.ref); });
  c.debrief.references.forEach((r) => { if (!/^10\.\d{4,}\//.test(r.doi)) errs.push('文獻 ' + r.id + ' 的 DOI 格式不對'); });
  return errs;
}
