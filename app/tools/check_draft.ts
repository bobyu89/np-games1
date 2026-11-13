// 還沒登記進目錄的主訴和病例，先單獨檢查：
//   node tools/check_draft.ts src/data/back-pain.ts src/data/c06a.ts src/data/c06b.ts ...
// 第一個檔案是主訴模組，後面是那個主訴的病例。檢查的內容和 npm run cases 一樣。
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveCase, type CaseSpec, type ComplaintDef } from '../src/core/module.ts';
import { validateCase } from '../src/core/validate.ts';
import { idealActions, run } from '../src/core/autoplay.ts';
import { scoreSession, SAFETY_LABEL } from '../src/core/scoring.ts';
import { formOf } from '../src/core/engine.ts';

const load = async (file: string) => Object.values(await import(pathToFileURL(resolve(file)).href)) as unknown[];
const [modFile, ...caseFiles] = process.argv.slice(2);
if (!modFile || !caseFiles.length) { console.log('用法：node tools/check_draft.ts <主訴模組> <病例> [病例…]'); process.exit(2); }
const m = (await load(modFile)).find((x) => !!x && typeof x === 'object' && 'forms' in x && 'questions' in x) as ComplaintDef | undefined;
if (!m) { console.log('✗ ' + modFile + ' 裡找不到主訴模組'); process.exit(1); }
let bad = 0;
const problems: string[] = [];
if (m.forms.length !== 4) problems.push('診斷要四個，現在 ' + m.forms.length + ' 個');
if (m.questions.length !== 25) problems.push('問題要 25 題，現在 ' + m.questions.length + ' 題');
if (m.exams.length !== 10) problems.push('評估要 10 項，現在 ' + m.exams.length + ' 項');
if (m.tests.length !== 4) problems.push('檢查要 4 項，現在 ' + m.tests.length + ' 項');
if (!m.shadow.look) problems.push('症影沒有寫 look');
problems.forEach((p) => console.log('✗ 主訴模組：' + p));
bad += problems.length;
const truths: string[] = [];
for (const file of caseFiles) {
  const spec = (await load(file)).find((x) => !!x && typeof x === 'object' && 'answers' in x && 'findings' in x) as CaseSpec | undefined;
  if (!spec) { console.log('✗ ' + file + ' 裡找不到病例'); bad += 1; continue; }
  try {
    const c = resolveCase(m, spec), errs = validateCase(c);
    const acts = idealActions(c), s = run(c, acts), sc = scoreSession(c, s), wrong = scoreSession(c, run(c, acts, true));
    const tells = c.clues.filter((k) => k.tell).length;
    const ok = !errs.length && sc.safety === 'met' && sc.total >= 90;
    if (!ok) bad += 1;
    truths.push(c.answer.truth);
    console.log((ok ? '✓' : '✗') + ' ' + c.id + '｜' + c.title + '｜' + c.patient.name + '｜診斷：' + formOf(c, c.answer.truth)!.name + '｜' + (c.timeline.worsenAfter !== undefined ? '不穩定' : '穩定'));
    console.log('    要解讀的線索 ' + tells + '、安全行動 ' + c.safety.map((r) => r.type).join('+') + '；理想 ' + sc.total + ' 分・' + SAFETY_LABEL[sc.safety] + '；全部選錯診斷 ' + wrong.total + ' 分・' + SAFETY_LABEL[wrong.safety]);
    errs.forEach((e) => console.log('    ✗ ' + e));
    if (!errs.length && !ok) console.log('    ✗ 照理想的打法拿不到九十分或安全達成：' + sc.safetyNote + ' ' + sc.rows.map((r) => r.id + ' ' + r.got + '/' + r.max).join(' '));
    if (c.review.state !== '未審查') { console.log('    ✗ review.state 要寫「未審查」'); bad += 1; }
    if (tells < 7 || tells > 9) console.log('    ！要解讀的線索建議 7 到 9 條，現在 ' + tells + ' 條');
  } catch (e) { console.log('✗ ' + file + '：' + (e as Error).message); bad += 1; }
}
if (new Set(truths).size !== truths.length) { console.log('✗ 有兩位病人是同一個診斷'); bad += 1; }
console.log(bad ? '\n有 ' + bad + ' 個地方要修。' : '\n這個主訴的 ' + caseFiles.length + ' 個病例都可以用。');
process.exit(bad ? 1 : 0);
