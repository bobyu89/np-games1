// 評分：照官方口試的配分，資料收集與診察 55、推理與決策 45。
// 每一項都寫清楚看哪個行動、給幾分。同樣的對局一定得到同樣的分數。
// 這是訓練用的分數，不代表正式甄審的成績。
import type { CaseDef, RubricRow, Safety, SafetyRule, Score, Session } from './types.ts';
import { clueOf, formOf } from './engine.ts';

const round1 = (n: number) => Math.round(n * 10) / 10;
const ratio = (got: number, need: number) => (need <= 0 ? 0 : Math.max(0, Math.min(1, got / need)));
const mmss = (t: number) => Math.floor(t / 60) + ' 分 ' + String(t % 60).padStart(2, '0') + ' 秒';

/** 通報或病況變化之後有沒有重測；穩定的病人則是隔一段時間再量一次 */
function remeasured(s: Session): boolean {
  if (s.vitalsLog.length < 2) return false;
  const since = Math.min(s.calledAt ?? Infinity, s.worsenedAt ?? Infinity);
  return since === Infinity ? s.vitalsLog[s.vitalsLog.length - 1] - s.vitalsLog[0] >= 120 : s.vitalsLog.some((t) => t >= since);
}

/** 一條安全行動做到了沒：met 做到、part 做了一部分或晚了、miss 沒做 */
function judge(c: CaseDef, s: Session, r: SafetyRule): { got: number; state: 'met' | 'part' | 'miss'; note: string } {
  const who = c.patient.name;
  switch (r.type) {
    case 'call': {
      const byYou = s.calledBy === 'you', early = byYou && (s.worsenedAt === null || s.calledAt! <= s.worsenedAt);
      if (early) return { got: r.points, state: 'met', note: '在' + who + '變差之前就通報了（' + mmss(s.calledAt!) + '）。' };
      if (byYou) return { got: r.points / 2, state: 'part', note: who + '變差之後才通報（' + mmss(s.calledAt!) + '），有補救回來。' };
      return { got: 0, state: 'miss', note: s.calledBy === 'mentor' ? '沒有通報，由岑禾接手敲鐘。' : '沒有通報。' };
    }
    case 'order': {
      const o = s.ordered.find((k) => k.id === r.test), label = c.tests.find((t) => t.id === r.test)!.label, limit = Math.round(r.by / 60);
      if (!o) return { got: 0, state: 'miss', note: '沒有提出' + label + '。' };
      if (o.at <= r.by) return { got: r.points, state: 'met', note: label + '在 ' + mmss(o.at) + ' 提出，在 ' + limit + ' 分鐘內。' };
      return { got: r.points / 3, state: 'part', note: label + '在 ' + mmss(o.at) + ' 才提出，超過 ' + limit + ' 分鐘。' };
    }
    case 'exclude': {
      const done = r.forms.filter((f) => s.reads.some((x) => x.ok && clueOf(c, x.clue).tell?.form === f && clueOf(c, x.clue).tell?.dir === -1));
      const left = r.forms.filter((f) => !done.includes(f)).map((f) => formOf(c, f)!.name);
      if (!left.length) return { got: r.points, state: 'met', note: '每個危險的真身，都找到了讓它比較不像的線索。' };
      return { got: r.points * ratio(done.length, r.forms.length), state: done.length ? 'part' : 'miss', note: '還沒有線索讓這幾個比較不像：' + left.join('、') + '。' };
    }
    case 'explain': {
      const said = (s.explained ?? []).includes(r.id);
      return said ? { got: r.points, state: 'met', note: '有交代什麼情況要馬上回來。' } : { got: 0, state: 'miss', note: '沒有交代什麼情況要馬上回來。' };
    }
    case 'calm':
      return s.bell ? { got: 0, state: 'part', note: who + '很穩定，這次不需要敲值班鐘。鐘是留給等不了的病人。' } : { got: r.points, state: 'met', note: '判斷' + who + '穩定，沒有動用值班鐘。' };
  }
}

export function scoreSession(c: CaseDef, s: Session): Score {
  const rows: RubricRow[] = [];
  const row = (id: string, track: 'data' | 'reason', name: string, max: number, got: number, notes: string[]) => rows.push({ id, track, name, max, got: round1(Math.max(0, Math.min(max, got))), notes });

  // ── 焦點病史 25：問到的份量 ÷ 全部份量的八成 ──
  const qs = c.questions.filter((q) => q.weight > 0);
  const qTotal = qs.reduce((n, q) => n + q.weight, 0), qGot = qs.filter((q) => s.asked.includes(q.id)).reduce((n, q) => n + q.weight, 0);
  const missedKeyQ = qs.filter((q) => q.weight >= 3 && !s.asked.includes(q.id)).map((q) => q.label);
  row('history', 'data', '焦點病史', 25, 25 * ratio(qGot, qTotal * 0.8), [
    '問了 ' + s.asked.filter((id) => id !== 'q-intro').length + ' 題，共 ' + qs.length + ' 題。',
    ...(missedKeyQ.length ? ['沒問到的重點：' + missedKeyQ.join('、') + '。'] : ['重點都問到了。']),
  ]);

  // ── 生命徵象與焦點身體評估 20 ──
  const measured = s.vitalsLog.length > 0, again = remeasured(s);
  const eTotal = c.exams.reduce((n, e) => n + e.weight, 0), eGot = c.exams.filter((e) => s.examined.some((k) => k.id === e.id)).reduce((n, e) => n + e.weight, 0);
  const missedExam = c.exams.filter((e) => e.weight >= 2 && !s.examined.some((k) => k.id === e.id)).map((e) => e.label);
  row('exam', 'data', '生命徵象與焦點身體評估', 20, (measured ? 5 : 0) + (again ? 3 : 0) + 12 * ratio(eGot, eTotal * 0.8), [
    measured ? '量了生命徵象。' : '沒有量生命徵象。',
    again ? '之後有重測。' : '之後沒有重測。',
    ...(missedExam.length ? ['沒做的重點評估：' + missedExam.join('、') + '。'] : ['重點評估都做了。']),
  ]);

  // ── 取得同意與說明檢查 10 ──
  const intro = s.asked.includes('q-intro'), told = s.examined.filter((k) => k.explained).length;
  row('consent', 'data', '取得同意與說明檢查', 10, (intro ? 4 : 0) + 6 * ratio(told, s.examined.length), [
    intro ? '有自我介紹並確認身分。' : '沒有自我介紹、確認身分。',
    s.examined.length ? '做了 ' + s.examined.length + ' 項評估，其中 ' + told + ' 項有先說明。' : '沒有做身體評估。',
  ]);

  // ── 問題摘要和優先的鑑別 15 ──
  const sum = c.summaries.find((k) => k.id === s.board.summary), truth = formOf(c, c.answer.truth)!;
  const likelyOk = s.board.likely === c.answer.truth;
  const exPts = Math.min(5, s.board.exclude.reduce((n, id) => n + (c.answer.exclude[id] ?? 0), 0));
  row('ddx', 'reason', '問題摘要和優先的鑑別', 15, (sum?.score ?? 0) + (likelyOk ? 5 : 0) + exPts, [
    sum ? '問題摘要：' + sum.note : '沒有寫問題摘要。',
    s.board.likely ? '最可能：' + formOf(c, s.board.likely)!.name + (likelyOk ? '。和線索吻合。' : '。這一關的線索指向' + truth.name + '。') : '沒有選最可能的問題。',
    s.board.exclude.length ? '還要排除：' + s.board.exclude.map((id) => formOf(c, id)!.name).join('、') + '。' : '沒有列出還要排除的問題。',
  ]);

  // ── 支持和反對的證據 10：線索解讀對了幾條 ──
  const ok = s.reads.filter((r) => r.ok).length, wrong = s.reads.length - ok;
  row('evidence', 'reason', '支持和反對的證據', 10, 10 * ratio(ok, c.readsNeeded), [
    s.reads.length ? '解讀了 ' + s.reads.length + ' 條線索，對 ' + ok + ' 條' + (wrong ? '、錯 ' + wrong + ' 條' : '') + '。對 ' + c.readsNeeded + ' 條就拿滿。' : '沒有拿到需要解讀的線索。',
    ...s.reads.filter((r) => !r.ok).slice(0, 3).map((r) => '「' + clueOf(c, r.clue).text + '」：' + (clueOf(c, r.clue).why ?? '')),
  ]);

  // ── 照護、回報和重評 15：安全行動 9、回報 4、重評 2 ──
  const judged = c.safety.map((r) => judge(c, s, r));
  const as = c.sbar.assessments.find((k) => k.id === s.report?.a);
  const reqOk = c.sbar.requests.filter((k) => k.ok), rOk = (s.report?.r ?? []).filter((id) => reqOk.some((k) => k.id === id)).length, rBad = (s.report?.r.length ?? 0) - rOk;
  row('care', 'reason', '照護、回報和重評', 15, judged.reduce((n, j) => n + j.got, 0) + (as?.score ?? 0) + Math.max(0, 2 * ratio(rOk, reqOk.length) - rBad) + (again ? 2 : 0), [
    ...judged.map((j) => j.note),
    s.report ? '回報：' + (as?.note ?? '') : '沒有向值班醫師回報。',
  ]);

  // ── 對病人說明 5 ──
  const said = (s.explained ?? []).map((id) => c.explain.find((k) => k.id === id)!);
  const plain = said.filter((e) => e.ok && !e.concern).length, concern = said.some((e) => e.concern), bad = said.filter((e) => !e.ok);
  row('explain', 'reason', '對病人說明', 5, Math.min(3, plain) + (concern ? 2 : 0) - bad.length * 1.5, [
    s.explained ? '說了 ' + said.length + ' 句。' + (bad.length ? '其中不適合的：' + bad.map((e) => e.note).join(' ') : '') : '沒有向' + c.patient.name + '說明。',
    concern ? '有回應' + c.patient.pronoun + '最在意的事。' : s.clues.includes('c-concern') ? '問到了' + c.patient.pronoun + '擔心的事，但說明的時候沒有回應。' : '沒有問' + c.patient.pronoun + '擔心什麼，所以也沒辦法回應。',
  ]);

  const sumOf = (t: 'data' | 'reason') => round1(rows.filter((r) => r.track === t).reduce((n, r) => n + r.got, 0));
  const data = sumOf('data'), reason = sumOf('reason');

  const misses = judged.filter((j) => j.state === 'miss'), parts = judged.filter((j) => j.state === 'part');
  const safety: Safety = misses.length || s.calledBy === 'mentor' ? 'review' : parts.length ? 'late' : 'met';
  const safetyNote = safety === 'met' ? '這一關的安全行動都做到了。' : [...misses, ...parts].map((j) => j.note).join(' ');
  return { rows, data, reason, total: round1(data + reason), safety, safetyNote };
}

export const SAFETY_LABEL: Record<Safety, string> = { met: '達成', late: '部分達成', review: '需要複核' };

/** 回顧的第一步：幾個影響判斷的時間點，和那一刻手上有的線索 */
export function moments(c: CaseDef, s: Session): { id: string; t: number; name: string; clues: string[] }[] {
  const at = (t: number) => s.log.filter((l) => l.type === 'clue' && l.t <= t).map((l) => l.clue!);
  const first = (type: string, id?: string) => s.log.find((l) => l.type === type && (id === undefined || l.id === id));
  const out: { id: string; t: number; name: string; clues: string[] }[] = [];
  const add = (id: string, l: { t: number } | undefined, name: string) => { if (l) out.push({ id, t: l.t, name, clues: at(l.t) }); };
  add('vitals', first('vitals'), '第一次量到生命徵象');
  const commit = first('commit');
  add('commit', commit, '你說最擔心的是' + (formOf(c, commit?.id ?? null)?.name ?? ''));
  add('call', first('call'), s.calledBy === 'mentor' ? '岑禾接手敲鐘' : '你通報了');
  add('worsen', first('worsen'), c.patient.name + '的狀況變差');
  const keyTest = c.safety.find((r) => r.type === 'order');
  if (keyTest && keyTest.type === 'order') add('result', first('result', keyTest.test), c.tests.find((t) => t.id === keyTest.test)!.label + '的結果回來');
  add('board', [...s.log].reverse().find((l) => l.type === 'board'), '你排好推理板');
  return out.sort((a, b) => a.t - b.t);
}

/** 你的想法怎麼變：中途說最擔心的、結案時選的、實際的真身 */
export function trajectory(c: CaseDef, s: Session): { steps: { t: number; name: string; right: boolean }[]; truth: string; verdict: string } {
  const steps = s.commits.map((k) => ({ t: k.t, name: formOf(c, k.form)!.name, right: k.form === c.answer.truth }));
  const truth = formOf(c, c.answer.truth)!.name, first = steps[0], last = steps[steps.length - 1];
  let verdict = '這一場沒有留下你的判斷。';
  if (steps.length === 1) verdict = last.right ? '你的判斷和線索吻合。' : '你的判斷和線索指的方向不一樣。回去看哪幾條線索被放掉了。';
  if (steps.length >= 2) {
    if (first.right && last.right) verdict = '你一開始的判斷就對了，後面的線索也支持它。記得：一開始就對，不代表可以不找反證。';
    else if (!first.right && last.right) verdict = '你跟著線索改了想法。這就是推理：先有假設，再讓證據修正它。';
    else if (first.right && !last.right) verdict = '你一開始想對了，後來被別的線索帶走。回去看是哪一條。';
    else verdict = '從頭到尾都停在同一個方向，沒有被線索修正。太早認定，是最常見的陷阱。';
  }
  return { steps, truth, verdict };
}

/** 回顧的第三步：依這一場漏掉的地方，列出幾個「下次要做到的事」讓玩家選一個 */
export function takeaways(c: CaseDef, s: Session, sc: Score): string[] {
  const got = (id: string) => sc.rows.find((r) => r.id === id)!;
  const has = (type: SafetyRule['type']) => c.safety.some((r) => r.type === type);
  const out: string[] = [];
  if (has('call') && sc.safety !== 'met') out.push('看到危險訊號就先通報，再回頭補問病史。');
  if (has('calm') && s.bell) out.push('先判斷病人穩不穩定，再決定要不要敲值班鐘。');
  if (c.safety.some((r) => r.type === 'order' && !s.ordered.some((o) => o.id === r.test && o.at <= r.by))) out.push('越早做越好的檢查，一開始就提出。');
  if (has('exclude') && sc.safety !== 'met') out.push('說「沒事」之前，每個危險的可能都要有一條排除它的線索。');
  if (got('consent').got < 8) out.push('動手評估之前，先說明目的、項目和部位。');
  if (got('evidence').got < 7) out.push('每拿到一條線索，先想它讓哪個診斷更像、哪個比較不像。');
  if (!s.clues.includes('c-concern') || got('explain').got < 4) out.push('問病人最擔心什麼，說明的時候回應它。');
  if (got('ddx').got < 12) out.push('先用一句話講事實，再排最可能的和不能漏掉的。');
  if (got('exam').notes[1].includes('沒有重測')) out.push('處置或病況變化之後，重測生命徵象。');
  out.push('病史不用一次問完，先問會改變處置的那幾題。');
  return out.slice(0, 4);
}

/** 這一場可以寫進圖鑑的東西：解讀對的線索、有沒有認出真身 */
export function harvest(c: CaseDef, s: Session): { reads: { clue: string; text: string; form: string; dir: 1 | -1 }[]; found: boolean; concern: boolean } {
  const reads = s.reads.filter((r) => r.ok).map((r) => { const k = clueOf(c, r.clue); return { clue: r.clue, text: k.text, form: k.tell!.form, dir: k.tell!.dir }; });
  return { reads, found: s.board.likely === c.answer.truth, concern: (s.explained ?? []).some((id) => c.explain.find((e) => e.id === id)?.concern) };
}
