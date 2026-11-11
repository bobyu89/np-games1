// 評分：照官方口試的配分，資料收集與診察 55、推理與決策 45。
// 每一項都寫清楚看哪個行動、給幾分。同樣的對局一定得到同樣的分數。
// 這是訓練用的分數，不代表正式甄審的成績。
import type { CaseDef, RubricRow, Safety, Score, Session } from './types.ts';

const round1 = (n: number) => Math.round(n * 10) / 10;
const ratio = (got: number, need: number) => (need <= 0 ? 0 : Math.max(0, Math.min(1, got / need)));

export function scoreSession(c: CaseDef, s: Session): Score {
  const tl = c.timeline, rows: RubricRow[] = [];
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
  const measured = s.vitalsLog.length > 0;
  const since = Math.min(s.calledAt ?? Infinity, s.worsenedAt ?? Infinity);
  const remeasured = s.vitalsLog.length >= 2 && s.vitalsLog.some((t) => t >= since);
  const eTotal = c.exams.reduce((n, e) => n + e.weight, 0), eGot = c.exams.filter((e) => s.examined.some((k) => k.id === e.id)).reduce((n, e) => n + e.weight, 0);
  const missedExam = c.exams.filter((e) => e.weight >= 2 && !s.examined.some((k) => k.id === e.id)).map((e) => e.label);
  row('exam', 'data', '生命徵象與焦點身體評估', 20, (measured ? 5 : 0) + (remeasured ? 3 : 0) + 12 * ratio(eGot, eTotal * 0.8), [
    measured ? '量了生命徵象。' : '沒有量生命徵象。',
    remeasured ? '通報或病況變化之後有重測。' : '通報或病況變化之後沒有重測。',
    ...(missedExam.length ? ['沒做的重點評估：' + missedExam.join('、') + '。'] : ['重點評估都做了。']),
  ]);

  // ── 取得同意與說明檢查 10 ──
  const intro = s.asked.includes('q-intro'), told = s.examined.filter((k) => k.explained).length;
  row('consent', 'data', '取得同意與說明檢查', 10, (intro ? 4 : 0) + 6 * ratio(told, s.examined.length), [
    intro ? '有自我介紹並確認身分。' : '沒有自我介紹、確認身分。',
    s.examined.length ? '做了 ' + s.examined.length + ' 項評估，其中 ' + told + ' 項有先說明。' : '沒有做身體評估。',
  ]);

  // ── 問題摘要和優先的鑑別 15 ──
  const sum = c.summaries.find((k) => k.id === s.board.summary);
  const likelyOk = s.board.likely === c.answer.likely;
  const exPts = Math.min(5, s.board.exclude.reduce((n, id) => n + (c.answer.exclude[id] ?? 0), 0));
  const hyp = (id: string | null) => c.hypotheses.find((h) => h.id === id);
  row('ddx', 'reason', '問題摘要和優先的鑑別', 15, (sum?.score ?? 0) + (likelyOk ? 5 : 0) + exPts, [
    sum ? '問題摘要：' + sum.note : '沒有寫問題摘要。',
    s.board.likely ? '最可能：' + hyp(s.board.likely)!.name + (likelyOk ? '。和線索吻合。' : '。這一關的線索指向' + hyp(c.answer.likely)!.name + '。') : '沒有選最可能的問題。',
    s.board.exclude.length ? '還要排除：' + s.board.exclude.map((id) => hyp(id)!.name).join('、') + '。' : '沒有列出還要排除的問題。',
  ]);

  // ── 支持和反對的證據 10 ──
  const lk = hyp(s.board.likely), ex = hyp(s.board.exclude[0] ?? null);
  const supOk = lk ? s.board.support.filter((id) => lk.support.includes(id)).length : 0, supBad = s.board.support.length - supOk;
  const agOk = ex ? s.board.against.filter((id) => ex.against.includes(id)).length : 0, agBad = s.board.against.length - agOk;
  row('evidence', 'reason', '支持和反對的證據', 10, Math.max(0, 5 * ratio(supOk, 3) - supBad) + Math.max(0, 5 * ratio(agOk, 2) - agBad), [
    lk ? '支持「' + lk.name + '」的線索：對 ' + supOk + ' 條' + (supBad ? '，不相干 ' + supBad + ' 條' : '') + '。三條就拿滿。' : '沒有標支持的線索。',
    ex ? '讓「' + ex.name + '」比較不像的線索：對 ' + agOk + ' 條' + (agBad ? '，不相干 ' + agBad + ' 條' : '') + '。兩條就拿滿。' : '沒有標反對的線索。',
  ]);

  // ── 照護、回報和重評 15 ──
  const byYou = s.calledBy === 'you', early = byYou && (s.worsenedAt === null || s.calledAt! <= s.worsenedAt);
  const ecg = s.ordered.find((o) => o.id === tl.ecgTest), ecgOnTime = !!ecg && ecg.at <= tl.ecgBy;
  const as = c.sbar.assessments.find((k) => k.id === s.report?.a);
  const reqOk = c.sbar.requests.filter((k) => k.ok), rOk = (s.report?.r ?? []).filter((id) => reqOk.some((k) => k.id === id)).length, rBad = (s.report?.r.length ?? 0) - rOk;
  const mmss = (t: number) => Math.floor(t / 60) + ' 分 ' + String(t % 60).padStart(2, '0') + ' 秒';
  row('care', 'reason', '照護、回報和重評', 15, (early ? 6 : byYou ? 3 : 0) + (ecgOnTime ? 3 : ecg ? 1 : 0) + (as?.score ?? 0) + Math.max(0, 2 * ratio(rOk, reqOk.length) - rBad) + (remeasured ? 2 : 0), [
    early ? '在病況變差之前就敲了值班鐘（' + mmss(s.calledAt!) + '）。' : byYou ? '病況變差之後才敲值班鐘（' + mmss(s.calledAt!) + '）。' : s.calledBy === 'mentor' ? '沒有通報，由岑禾接手敲鐘。' : '沒有通報。',
    ecg ? '心電圖在 ' + mmss(ecg.at) + ' 提出' + (ecgOnTime ? '，在 10 分鐘內。' : '，超過 10 分鐘。') : '沒有提出心電圖。',
    s.report ? '回報：' + (as?.note ?? '') : '沒有向值班醫師回報。',
  ]);

  // ── 對病人說明 5 ──
  const said = (s.explained ?? []).map((id) => c.explain.find((k) => k.id === id)!);
  const plain = said.filter((e) => e.ok && !e.concern).length, concern = said.some((e) => e.concern), wrong = said.filter((e) => !e.ok);
  row('explain', 'reason', '對病人說明', 5, Math.min(3, plain) + (concern ? 2 : 0) - wrong.length * 1.5, [
    s.explained ? '說了 ' + said.length + ' 句。' + (wrong.length ? '其中不適合的：' + wrong.map((e) => e.note).join(' ') : '') : '沒有向林秋說明。',
    concern ? '有回應他最在意的事。' : s.clues.includes('c-concern') ? '問到了他擔心女兒，但說明的時候沒有回應。' : '沒有問他擔心什麼，所以也沒辦法回應。',
  ]);

  const sumOf = (t: 'data' | 'reason') => round1(rows.filter((r) => r.track === t).reduce((n, r) => n + r.got, 0));
  const data = sumOf('data'), reason = sumOf('reason');

  let safety: Safety, safetyNote: string;
  if (!byYou || !ecg) { safety = 'review'; safetyNote = !byYou ? '這一關的安全行動是在病況變差之前通報。這次沒有做到，由岑禾接手。' : '有通報，但整場都沒有提出心電圖。'; }
  else if (early && ecgOnTime) { safety = 'met'; safetyNote = '在病況變差之前通報，心電圖也在 10 分鐘內提出。'; }
  else { safety = 'late'; safetyNote = !early ? '病況變差之後才通報，有補救回來。' : '有及時通報，但心電圖超過 10 分鐘才提出。'; }

  return { rows, data, reason, total: round1(data + reason), safety, safetyNote };
}

export const SAFETY_LABEL: Record<Safety, string> = { met: '達成', late: '延遲補救', review: '需要複核' };

/** 回顧的第一步：幾個影響判斷的時間點，和那一刻手上有的線索 */
export function moments(c: CaseDef, s: Session): { id: string; t: number; name: string; clues: string[] }[] {
  const at = (t: number) => s.log.filter((l) => l.type === 'clue' && l.t <= t).map((l) => l.clue!);
  const first = (type: string, id?: string) => s.log.find((l) => l.type === type && (id === undefined || l.id === id));
  const out: { id: string; t: number; name: string; clues: string[] }[] = [];
  const add = (id: string, l: { t: number } | undefined, name: string) => { if (l) out.push({ id, t: l.t, name, clues: at(l.t) }); };
  add('vitals', first('vitals'), '第一次量到生命徵象');
  add('call', first('call'), s.calledBy === 'mentor' ? '岑禾接手敲鐘' : '你敲了值班鐘');
  add('worsen', first('worsen'), '林秋的狀況變差');
  add('ecg', first('result', c.timeline.ecgTest), '心電圖的結果回來');
  add('board', [...s.log].reverse().find((l) => l.type === 'board'), '你排好推理板');
  return out.sort((a, b) => a.t - b.t);
}

/** 回顧的第三步：依這一場漏掉的地方，列出幾個「下次要做到的事」讓玩家選一個 */
export function takeaways(c: CaseDef, s: Session, sc: Score): string[] {
  const got = (id: string) => sc.rows.find((r) => r.id === id)!;
  const out: string[] = [];
  if (sc.safety !== 'met') out.push('看到危險訊號就先敲鐘，再回頭補問病史。');
  if (!s.ordered.some((o) => o.id === c.timeline.ecgTest && o.at <= c.timeline.ecgBy)) out.push('懷疑心臟的問題，10 分鐘內提出心電圖。');
  if (got('consent').got < 8) out.push('動手評估之前，先說明目的、項目和部位。');
  if (!s.vitalsLog.length || got('exam').notes[1].includes('沒有重測')) out.push('通報或病況變化之後，重測生命徵象。');
  if (got('evidence').got < 7) out.push('問一個能排除危險診斷的問題，把否定的答案也記下來。');
  if (!s.clues.includes('c-concern') || got('explain').got < 4) out.push('問病人最擔心什麼，說明的時候回應它。');
  if (got('ddx').got < 12) out.push('先用一句話講事實，再排最可能的和不能漏掉的。');
  out.push('病史不用一次問完，先問會改變處置的那幾題。');
  return out.slice(0, 4);
}
