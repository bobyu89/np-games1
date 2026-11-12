// 產生給臨床老師的審查清單：npm run review
// 內容全部從病例檔來，不要手改產生出來的檔案；病例改了就重跑一次。
//   docs/review/README.md      怎麼審、共用的設計、要特別確認的地方、文獻、索引
//   docs/review/<主訴>.md       每個主訴一份，裡面是那個主訴的每一位病人
//   --bundle <資料夾>           另外寫一份到別的資料夾（給 pandoc 轉成 Word 或網頁用），不動 docs/review/
//   --no-boxes                  不印「同意／要改」的欄位
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASES, COMPLAINTS } from '../src/data/index.ts';
import { ALL_REF_CHECK as REF_CHECK, ALL_REVIEW_ASKS as REVIEW_ASKS } from '../src/data/extras.ts';
import { COST, formOf } from '../src/core/engine.ts';
import { idealActions, run } from '../src/core/autoplay.ts';
import { scoreSession, SAFETY_LABEL } from '../src/core/scoring.ts';
import type { CaseDef, Clue, SafetyRule } from '../src/core/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../../docs/review');
const bundleAt = process.argv.indexOf('--bundle');
const bundlePath = bundleAt > 0 ? process.argv[bundleAt + 1] : null;
// --no-boxes：不印「同意／要改」的欄位（給只用來看、不用來填的網頁版）
const boxes = !process.argv.includes('--no-boxes');

const esc = (s: string) => s.replace(/\|/g, '｜').replace(/\n/g, ' ');
/** 最後一欄叫「審查」的表格，不印格子的時候整欄拿掉。widths：各欄的相對寬度（pandoc 轉 Word 的時候用） */
function table(head: string[], rows: string[][], widths?: number[]): string {
  const drop = !boxes && head[head.length - 1] === '審查', cut = <T>(r: T[]) => (drop ? r.slice(0, -1) : r);
  const h = cut(head), w = cut(widths ?? head.map(() => 1));
  return ['| ' + h.join(' | ') + ' |', '|' + w.map((n) => '-'.repeat(Math.max(3, n * 3))).join('|') + '|', ...rows.map((r) => '| ' + cut(r).map(esc).join(' | ') + ' |')].join('\n');
}
const BOX = '☐同意 ☐要改';
const GROUP = { open: '開場', cc: '主訴', hx: '病史', ros: '系統回顧' } as const;
const SCENE = { ward: '公會的病室', 'ward-rain': '公會的病室（下雨天）', dock: '碼頭的貨棧（出診）' } as const;
const sec = (n: number) => (n < 60 ? n + ' 秒' : n % 60 ? Math.floor(n / 60) + ' 分 ' + (n % 60) + ' 秒' : n / 60 + ' 分鐘');
const checkOf = (id: string) => { const k = REF_CHECK[id]; return (k?.level === 'abstract' ? '教學重點對過摘要' : '只核對書目') + (k?.note ? '（' + k.note + '）' : ''); };

/** 一條線索是從哪裡來的 */
function sourceOf(c: CaseDef, clueId: string): string {
  if (clueId === 'c-vitals') return '生命徵象';
  const q = c.questions.find((k) => k.clue === clueId); if (q) return '問診｜' + GROUP[q.group] + '｜' + q.label;
  const e = c.exams.find((k) => k.clue === clueId); if (e) return '評估｜' + e.part + '｜' + e.label;
  const t = c.tests.find((k) => k.clue === clueId); if (t) return '檢查｜' + t.label;
  return '';
}
const tellText = (c: CaseDef, t: { form: string; dir: 1 | -1 }) => formOf(c, t.form)!.name + '：' + (t.dir === 1 ? '更像' : '比較不像');

function safetyText(c: CaseDef, r: SafetyRule): string {
  switch (r.type) {
    case 'call': return '病況變差之前通報（敲值班鐘，或直接向醫師回報）';
    case 'order': return '下診斷之後 ' + sec(r.within) + '內提出「' + c.tests.find((t) => t.id === r.test)!.label + '」';
    case 'exclude': return '這幾個診斷，各要有一條解讀正確的「比較不像」的線索：' + r.forms.map((f) => formOf(c, f)!.name).join('、');
    case 'explain': return '向病人說明時要有這一句（' + (r.what ?? '交代什麼情況要馬上回來') + '）：「' + c.explain.find((e) => e.id === r.id)!.text + '」';
    case 'calm': return '病人穩定，不需要敲值班鐘（敲了算過度通報）';
  }
}

function caseSection(c: CaseDef): string {
  const truth = formOf(c, c.answer.truth)!, v = c.vitals, urgent = c.timeline.worsenAfter !== undefined;
  const s = run(c, idealActions(c)), sc = scoreSession(c, s);
  const tells = c.clues.filter((k) => k.tell), keys = c.clues.filter((k) => k.key && !k.tell);
  const vit = (x: typeof v.base) => [x.bp, String(x.hr), String(x.rr), x.spo2 + '%', x.bt.toFixed(1)];
  const out: string[] = [];
  const p = (...lines: string[]) => out.push(...lines, '');

  p('## ' + c.id.toUpperCase() + '｜' + c.title + '｜' + c.patient.name);
  p(table(['項目', '內容'], [
    ['主訴（括號裡是遊戲圖鑑上的名字）', c.complaintName + '（' + c.shadow.name + '）'],
    ['診斷（這一關的答案）', truth.name + '。' + truth.blurb],
    ['病人', c.patient.name + '，' + c.patient.age + ' 歲，' + c.patient.sex + '，' + c.patient.job],
    ['類型', c.kind],
    ['地點', SCENE[c.scene ?? 'ward']],
    ['穩不穩定', urgent ? '不穩定：下診斷之後 ' + sec(c.timeline.worsenAfter!) + '沒有人知道，病況會變差' : '穩定：這位病人不會變差，敲值班鐘算過度通報'],
    ['審查狀態', c.review.state],
    ['照理想的打法', sc.total + ' 分、' + SAFETY_LABEL[sc.safety] + '、模擬時間約 ' + Math.round(s.time / 60) + ' 分鐘'],
  ], [2, 9]));

  p('**玩家一開始讀到的**');
  p(c.reading.lines.map((l) => '> ' + l).join('\n>\n'));
  p('**讀完要想的三個問題**：' + c.reading.prompts.join('　'));
  p(table(['生命徵象', '血壓', '心跳', '呼吸', '血氧', '體溫'], [['一開始', ...vit(v.base)], ...(v.worse ? [['變差之後', ...vit(v.worse)]] : [])]));

  p('### 1. 要玩家自己解讀的線索（' + tells.length + ' 條，解讀對 ' + c.readsNeeded + ' 條拿滿）', '玩家拿到線索之後，要選它讓哪一個診斷更像或比較不像。請看「指向」和「理由」對不對、有沒有說得太滿。');
  p(table(['從哪裡來', '線索', '指向', '理由（解讀之後岑禾說的話）', '也算對的解讀', '審查'], tells.map((k: Clue) => [sourceOf(c, k.id), (k.key ? '★ ' : '') + k.text, tellText(c, k.tell!), k.why ?? '', (k.alsoOk ?? []).map((t) => tellText(c, t)).join('；') || '—', BOX]), [3, 4, 2, 6, 2, 3]));

  p('### 2. 其他關鍵線索（不用解讀，但沒拿到會被提醒）');
  p(keys.length ? table(['從哪裡來', '線索', '審查'], keys.map((k) => [sourceOf(c, k.id), k.text, BOX]), [3, 8, 2]) : '沒有。');

  p('### 3. 診斷和問題摘要');
  p('最可能的問題選「' + truth.name + '」得 5 分。「還要排除」的加分：' + (Object.entries(c.answer.exclude).map(([f, n]) => formOf(c, f)!.name + ' ' + n + ' 分').join('、') || '沒有') + '（最多 5 分）。');
  p(table(['問題摘要的選項', '分數', '選了之後的回饋', '審查'], c.summaries.map((k) => [k.text, String(k.score), k.note, BOX]), [7, 1, 6, 2]));

  p('### 4. 安全行動和時間');
  p(table(['安全行動', '分數', '審查'], c.safety.map((r) => [safetyText(c, r), String(r.points), BOX]), [10, 1, 2]));
  p(table(['時間點（從下診斷那一刻算起）', '發生什麼'], [
    ...(urgent ? [[sec(c.timeline.worsenAfter!) + '還沒有人知道', '病況變差：' + (c.lines.watchWorse ?? '')]] : [['—', '這位病人不會變差']]),
    ...(c.timeline.stepInAfter !== undefined ? [[sec(c.timeline.stepInAfter) + '還沒有人知道', '岑禾接手敲鐘（安全行動變成需要複核）']] : []),
    ['通報之後 ' + sec(c.timeline.doctorDelay), '值班醫師到場'],
  ], [4, 9]));

  p('### 5. 向值班醫師回報');
  p(table(['我的評估（選一句）', '分數', '回饋', '審查'], c.sbar.assessments.map((k) => [k.text, String(k.score), k.note, BOX]), [7, 1, 6, 2]));
  p(table(['我的請求（可以選好幾句）', '對或錯', '回饋', '審查'], c.sbar.requests.map((k) => [k.text + (k.orders ? '（等於提出「' + c.tests.find((t) => t.id === k.orders)!.label + '」）' : ''), k.ok ? '對' : '錯', k.note, BOX]), [7, 1, 6, 2]));

  p('### 6. 向病人說明');
  p(table(['說明的句子（可以選好幾句）', '對或錯', '回饋', '審查'], c.explain.map((k) => [k.text + (k.concern ? '（回應病人最擔心的事；要先問到才選得到）' : ''), k.ok ? '對' : '錯', k.note, BOX]), [7, 1, 6, 2]));

  p('### 7. 回顧裡寫給玩家的話');
  p(...c.debrief.alternatives.map((t) => '- ' + t));
  p(table(['教學重點', '出處', '核對到哪裡', '審查'], c.debrief.teaching.map((t) => { const r = c.debrief.references.find((k) => k.id === t.ref); return [t.text, r ? r.text.split('(')[0].trim().replace(/,$/, '') + '（' + (r.text.match(/\((\d{4})\)/)?.[1] ?? '') + '）' : t.ref, checkOf(t.ref), BOX]; }), [7, 3, 3, 2]));

  p('### 8. 完整的腳本', '<details><summary>問診 ' + c.questions.length + ' 題、身體評估 ' + c.exams.length + ' 項、檢查 ' + c.tests.length + ' 項、劇本裡的對話</summary>', '');
  p(table(['分段', '按鈕', '玩家怎麼問', '病人怎麼回答', '記下的線索'], c.questions.map((q) => [GROUP[q.group], q.label, q.ask, q.answer, q.clue ? c.clues.find((k) => k.id === q.clue)!.text : '—']), [1, 2, 5, 6, 4]));
  p(table(['部位', '評估項目', '看到、聽到、摸到的', '記下的線索'], c.exams.map((e) => [e.part, e.label, e.finding, e.clue ? c.clues.find((k) => k.id === e.clue)!.text : '—']), [1, 2, 7, 4]));
  p(table(['檢查', '多久有結果', '結果'], c.tests.map((t) => [t.label, t.delay ? sec(t.delay) : '這一關等不到', t.result ?? t.pending ?? '']), [3, 2, 9]));
  const L = c.lines;
  p(table(['什麼時候', '誰說', '說什麼'], [
    ...L.opening.map((t) => ['進病室', '岑禾', t]), ['陪著觀察', '旁白', L.watch], ...(L.watchWorse ? [['變差之後觀察', '旁白', L.watchWorse]] : []), ...(L.worsen ? [['變差的那一刻', c.patient.name, L.worsen]] : []),
    ...(L.stepIn ? [['太久沒有通報', '岑禾', L.stepIn]] : []), ['敲了值班鐘', '岑禾', L.called], ['醫師到場', '沈渡', L.doctorArrives], ['回報得好', '沈渡', L.reportGood], ['回報得不清楚', '沈渡', L.reportWeak],
    ...(L.testRead ? [['關鍵檢查的結果回來', '沈渡', L.testRead]] : []), ['說明得好', c.patient.name, L.explainOk], ['回應了他擔心的事', c.patient.name, L.explainConcern], ['說明得不好', c.patient.name, L.explainBad], ['結案', '岑禾', L.closing],
  ], [3, 1, 10]));
  p('</details>');

  if (boxes) p('### 這一關的整體意見', '☐ 4 可以用　☐ 3 小修　☐ 2 大修　☐ 1 不適合', '意見：', '', '審查人：　　　　　　日期：');
  p('---');
  return out.join('\n');
}

function complaintDoc(id: string): string {
  const m = COMPLAINTS.find((k) => k.id === id)!, cases = CASES.filter((c) => c.complaint === id);
  const out: string[] = ['# 審查清單：' + m.name + '（' + m.shadow.name + '）', '', '這份檔案是程式從病例檔產生的（`npm run review`），不要手改。怎麼審、共用的設計和文獻在 [README.md](README.md)。', ''];
  out.push('**圖鑑上的說明**（遊戲的世界觀，不是臨床內容）：' + m.shadow.lore, '');
  out.push('## 四個診斷', '', '同一個主訴底下可能的四類問題，玩家要在這四個裡面選最可能的、排除其他的（遊戲的圖鑑裡把它們叫做「真身」，病室裡一律說「診斷」）。這個分法是遊戲的骨架，請先看分得合不合理。', '');
  out.push(table(['診斷', '畫面上的字', '說明', '有哪位病人', '審查'], m.forms.map((f) => [f.name, f.mark, f.blurb, cases.filter((c) => c.answer.truth === f.id).map((c) => c.patient.name + '（' + c.id.toUpperCase() + '）').join('、') || '還沒有', BOX]), [2, 1, 7, 3, 2]), '');
  out.push('## 這個主訴的題目', '', '同一個主訴的每一位病人，畫面上的題目和檢查項目都一樣，只有回答不同。開場、病史、系統回顧是所有主訴共用的。', '');
  out.push(table(['分段', '按鈕', '玩家怎麼問', '份量'], m.questions.map((q) => [GROUP[q.group], q.label, q.ask, String(q.weight)]), [1, 2, 9, 1]), '');
  out.push(table(['部位', '評估項目', '動手之前對病人說的話', '份量'], m.exams.map((e) => [e.part, e.label, e.explain, String(e.weight)]), [1, 2, 9, 1]), '');
  out.push(table(['檢查', '多久有結果'], m.tests.map((t) => [t.label, t.delay ? sec(t.delay) : '這一關等不到'])), '', '---', '');
  cases.forEach((c) => out.push(caseSection(c)));
  return out.join('\n');
}

function readme(): string {
  const refs = new Map<string, { text: string; doi: string; used: string[] }>();
  CASES.forEach((c) => c.debrief.references.forEach((r) => { const k = refs.get(r.id) ?? { text: r.text, doi: r.doi, used: [] }; k.used.push(c.id.toUpperCase()); refs.set(r.id, k); }));
  const out: string[] = [];
  const p = (...lines: string[]) => out.push(...lines, '');
  p('# 給臨床老師的審查清單');
  p('《霧脈公會》現在有 ' + CASES.length + ' 個病例、' + COMPLAINTS.length + ' 個主訴。**全部都還沒經過臨床老師審查，不能當教材。**這份清單把每一關裡「有對錯」的地方攤開，請老師逐項看。');
  p('這一頁和各主訴的檔案都是程式從病例檔產生的（在 `app/` 底下跑 `npm run review`）。不要手改；病例改了，重跑一次就會更新。');
  p('## 怎麼審');
  p('每個主訴一份檔案。先看四個診斷分得合不合理，再一位一位看病人。每一位病人請看這七件事：');
  p('1. **故事**：年齡、職業、病程、生命徵象，合不合理？', '2. **診斷和線索**：這個診斷，和病人說的、評估到的，對不對得上？', '3. **要解讀的線索**：每一條的「指向」對不對？「理由」那句話有沒有說錯、說得太滿？', '4. **安全行動**：該不該敲值班鐘、時間限制合不合理、最關鍵的檢查是不是那一項？', '5. **回報和說明的選項**：標「對」的是不是真的對，標「錯」的是不是真的錯？有沒有超出專科護理師可以做的範圍？', '6. **教學重點**：敘述有沒有超出引用的文獻？', '7. **用語**：病人的話像不像病人會說的？有沒有不合臨床習慣的講法？');
  if (boxes) p('每一列後面有「☐同意 ☐要改」。每一位病人最後有一個整體的四點評分（4 可以用、3 小修、2 大修、1 不適合），和專家效度常用的四點量表同一個刻度；這只是方便彙整，不是正式的效度工具。');
  p('## 索引');
  p(table(['代號', '主訴', '診斷', '病人', '穩不穩定', '狀態', '在哪一份'], CASES.map((c) => [c.id.toUpperCase(), c.complaintName, formOf(c, c.answer.truth)!.name, c.patient.name + '，' + c.patient.age + ' 歲，' + c.patient.job, c.timeline.worsenAfter !== undefined ? '不穩定' : '穩定', c.review.state, '[' + c.complaint + '.md](' + c.complaint + '.md)'])));
  p('## 每一關共用的設計');
  p('這幾項是所有病例共用的規則。請老師看它們本身合不合理。');
  p('**流程**：問診 → 身體評估 → 下診斷 → 檢查與處置。照考站的順序，整套做完才說計畫。真實的情境不會等：血氧低就先處理、先叫人。這一點寫在每一關的回顧裡。生命徵象和值班鐘任何時候都可以用，提早通報不扣分。');
  p('**時間**：做一件事，模擬的時鐘才會走。');
  p(table(['行動', '花多少時間'], [['問一題', COST.ask + ' 秒'], ['量生命徵象', COST.vitals + ' 秒'], ['做一項身體評估', COST.exam + ' 秒'], ['動手之前先說明', '多 ' + COST.explainExam + ' 秒'], ['陪著觀察', COST.watch + ' 秒'], ['敲值班鐘', COST.call + ' 秒'], ['向醫師回報', COST.report + ' 秒'], ['向病人說明', COST.explain + ' 秒']]));
  p('整套問診加身體評估大約 15 分鐘（模擬的時間）。時間的壓力從下診斷那一刻才開始算。');
  p('**評分**（訓練用，不代表正式甄審的成績）：');
  p(table(['項目', '分數', '怎麼算'], [
    ['焦點病史', '25', '問到的題目份量，達到全部的八成就拿滿'],
    ['生命徵象與焦點身體評估', '20', '量了 5 分、之後重測 3 分、評估項目的份量 12 分（八成拿滿）'],
    ['取得同意與說明檢查', '10', '開場三件事 4 分、動手之前有說明的比例 6 分'],
    ['問題摘要和優先的鑑別', '15', '問題摘要最多 5 分、最可能的問題 5 分、還要排除的最多 5 分'],
    ['支持和反對的證據', '10', '線索解讀對的條數'],
    ['照護、回報和重評', '15', '安全行動 9 分、回報 4 分、重評 2 分'],
    ['對病人說明', '5', '說對的句子最多 3 分、回應病人擔心的事 2 分、說錯一句扣 1.5 分'],
  ], [4, 1, 9]));
  p('前三項是「資料收集與診察」55 分，後四項是「推理與決策」45 分。安全行動另外有一個結果：達成、部分達成、需要複核。有一條沒做到，或是由岑禾接手通報，就是需要複核。');
  p('## 要特別請老師確認的地方');
  p('下面是寫的時候就知道沒把握的地方。');
  p(...REVIEW_ASKS.map((t) => '- ' + t));
  p('## 文獻');
  p('書目資料都用 PubMed 核對過。「教學重點對過摘要」的意思是：遊戲裡引用它的那幾句話，和摘要的內容對過。「只核對書目」的意思是：確認這篇文獻存在、書目正確，但遊戲裡的敘述沒有逐句對過原文。');
  p(table(['文獻', '核對到哪裡', '哪幾關用到'], [...refs.entries()].sort((a, b) => a[1].text.localeCompare(b[1].text)).map(([id, r]) => [r.text + ' https://doi.org/' + r.doi, checkOf(id), r.used.join('、')]), [8, 4, 2]));
  return out.join('\n');
}

const files: [string, string][] = [['README.md', readme()], ...COMPLAINTS.map((m) => [m.id + '.md', complaintDoc(m.id)] as [string, string])];
const dir = bundlePath ? resolve(bundlePath) : outDir;
mkdirSync(dir, { recursive: true });
files.forEach(([name, text]) => writeFileSync(resolve(dir, name), text.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'));
if (bundlePath) writeFileSync(resolve(dir, 'ORDER'), files.map(([n]) => n).join('\n') + '\n'); // 照章節的順序，給轉檔的程式用
console.log('寫好 ' + files.length + ' 份，在 ' + dir + '：' + files.map(([n]) => n).join('、'));
