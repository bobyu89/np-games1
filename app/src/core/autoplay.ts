// 照病例的資料自動走出一條「理想的打法」。
// 用途：每個新病例都要能被這條路玩到安全達成、九十分以上。做不到，表示病例寫壞了。
import type { Action, CaseDef, Session } from './types.ts';
import { clueOf, createSession, perform } from './engine.ts';

/** 做一個行動，接著把跳出來的解讀和岑禾的提問都答對 */
export function step(c: CaseDef, s: Session, a: Action, wrongReads = false): Session {
  let cur = perform(c, s, a).session;
  for (let guard = 0; guard < 50 && (cur.pending.length || cur.needCommit); guard++) {
    if (cur.pending.length) {
      const id = cur.pending[0], right = clueOf(c, id).tell!.form;
      const form = wrongReads ? c.forms.find((f) => f.id !== right && !(clueOf(c, id).alsoOk ?? []).some((t) => t.form === f.id))!.id : right;
      cur = perform(c, cur, { type: 'read', clue: id, form }).session;
    } else cur = perform(c, cur, { type: 'commit', form: c.answer.truth }).session;
  }
  return cur;
}
export const run = (c: CaseDef, actions: Action[], wrongReads = false): Session => actions.reduce((s, a) => step(c, s, a, wrongReads), createSession(c));

export function idealActions(c: CaseDef): Action[] {
  const has = (type: string) => c.safety.some((r) => r.type === type);
  const out: Action[] = [{ type: 'ask', id: 'q-intro' }, { type: 'vitals' }];
  if (has('call')) out.push({ type: 'call' });
  c.safety.forEach((r) => { if (r.type === 'order') out.push({ type: 'test', id: r.test }); });
  c.questions.filter((q) => q.id !== 'q-intro').forEach((q) => out.push({ type: 'ask', id: q.id }));
  c.exams.forEach((e) => out.push({ type: 'exam', id: e.id, explain: true }));
  c.tests.forEach((t) => { if (!out.some((a) => a.type === 'test' && a.id === t.id)) out.push({ type: 'test', id: t.id }); });
  out.push({ type: 'vitals' });
  out.push({ type: 'report', a: c.sbar.assessments.find((k) => k.score === 2)!.id, r: c.sbar.requests.filter((k) => k.ok).map((k) => k.id) });
  out.push({ type: 'board', board: { summary: c.summaries.find((k) => k.score === 5)!.id, likely: c.answer.truth, exclude: Object.keys(c.answer.exclude) } });
  out.push({ type: 'explain', ids: c.explain.filter((e) => e.ok).slice(0, 4).map((e) => e.id) });
  // 理想的說明要包含回應擔心的那一句和安全行動要求的那一句
  const must = [...c.explain.filter((e) => e.concern).map((e) => e.id), ...c.safety.flatMap((r) => (r.type === 'explain' ? [r.id] : []))];
  const picked = [...new Set([...must, ...c.explain.filter((e) => e.ok).map((e) => e.id)])].slice(0, 4);
  out[out.length - 1] = { type: 'explain', ids: picked };
  out.push({ type: 'close' });
  return out;
}
