// 檢查所有病例，印出一張總表。寫完新病例之後跑：npm run cases
import { CASES } from '../src/data/index.ts';
import { validateCase } from '../src/core/validate.ts';
import { idealActions, run } from '../src/core/autoplay.ts';
import { scoreSession, SAFETY_LABEL } from '../src/core/scoring.ts';
import { formOf } from '../src/core/engine.ts';

let bad = 0;
for (const c of CASES) {
  const errs = validateCase(c);
  const acts = idealActions(c), s = run(c, acts), sc = scoreSession(c, s);
  const tells = c.clues.filter((k) => k.tell).length, taps = acts.length + s.reads.length + s.commits.length;
  const ok = !errs.length && sc.safety === 'met' && sc.total >= 90;
  if (!ok) bad += 1;
  console.log((ok ? '✓' : '✗') + ' ' + c.id + '｜' + c.complaintName + '｜' + c.kind + '｜' + c.title + '｜' + c.patient.name + '｜診斷：' + formOf(c, c.answer.truth)!.name + '｜' + c.review.state);
  console.log('    問題 ' + c.questions.length + '、評估 ' + c.exams.length + '、檢查 ' + c.tests.length + '、要解讀的線索 ' + tells + '、安全行動 ' + c.safety.map((r) => r.type).join('+'));
  console.log('    理想的打法：' + sc.total + ' 分、' + SAFETY_LABEL[sc.safety] + '、模擬時間 ' + Math.round(s.time / 60) + ' 分鐘、大約點 ' + taps + ' 下');
  errs.forEach((e) => console.log('    ✗ ' + e));
  if (!errs.length && !ok) console.log('    ✗ 照理想的打法拿不到九十分或安全達成：' + sc.safetyNote + ' ' + sc.rows.map((r) => r.id + ' ' + r.got + '/' + r.max).join(' '));
}
console.log(bad ? '\n有 ' + bad + ' 個病例要修。' : '\n' + CASES.length + ' 個病例都可以用。');
process.exit(bad ? 1 : 0);
