// 長期的推進：委託怎麼解鎖、故事什麼時候往下走、圖鑑怎麼被寫回來、階級怎麼升。
// 全部從「玩過哪些病例、解讀對哪些線索」算出來，沒有另外的經驗值。
import type { CaseDef, Score, Session } from '../core/types.ts';
import type { ComplaintDef } from '../core/module.ts';
import { harvest } from '../core/scoring.ts';
import { CASES } from '../data/index.ts';
import type { Line } from './Talk.tsx';
import type { CaseRecord, Save } from './store.ts';
import type { Shot } from './Portrait.tsx';

/** 委託板上的一張委託。needs：要先完成哪一張才會出現 */
export interface Quest { caseId: string; chapter: number; needs?: string | string[] }
export const QUESTS: Quest[] = [{ caseId: 'c01a', chapter: 1 }, { caseId: 'c01b', chapter: 1, needs: 'c01a' }, { caseId: 'c01c', chapter: 1, needs: 'c01b' }, { caseId: 'c01d', chapter: 1, needs: 'c01c' },
  // 第二章：第一章走完才會貼上板子。兩隻症影可以交錯著接
  { caseId: 'c02a', chapter: 2, needs: 'c01d' }, { caseId: 'c02b', chapter: 2, needs: 'c02a' }, { caseId: 'c02c', chapter: 2, needs: 'c02b' }, { caseId: 'c02d', chapter: 2, needs: 'c02c' },
  { caseId: 'c03a', chapter: 2, needs: 'c01d' }, { caseId: 'c03b', chapter: 2, needs: 'c03a' }, { caseId: 'c03c', chapter: 2, needs: 'c03b' }, { caseId: 'c03d', chapter: 2, needs: 'c03c' },
  // 第三章：第二章的八張都走完才會貼上板子
  { caseId: 'c04a', chapter: 3, needs: ['c02d', 'c03d'] }, { caseId: 'c04b', chapter: 3, needs: 'c04a' },
  { caseId: 'c05a', chapter: 3, needs: ['c02d', 'c03d'] }, { caseId: 'c05b', chapter: 3, needs: 'c05a' }];
export const unlocked = (q: Quest, s: Save) => [q.needs ?? []].flat().every((id) => !!s.cases[id]);

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
  { id: 'ch1-third', title: '第一章　同一張面孔', when: (s) => !!s.cases.c01a && !!s.cases.c01b, lines: [
    { who: 'mo', text: '兩個人，同一隻蛾，兩個真身。舊索引那一行，我劃掉了。' },
    { who: 'mentor', text: '還沒完。這一頁底下還有兩盞燈，你沒看過它們亮起來的樣子。' },
    { who: 'mentor', text: '有位老船工，胸口悶了一個多月。他不急。你去想清楚：不急的，是不是就不要緊。' },
  ] },
  { id: 'ch1-fourth', title: '第一章　慢慢來的那一隻', when: (s) => !!s.cases.c01a && !!s.cases.c01b && !!s.cases.c01c, lines: [
    { who: 'mo', text: '鐵翅蛾這一頁，三個真身底下都有人名了。只剩「血管急症」那一盞，還沒有人讓它亮過。' },
    { who: 'mentor', text: '那一盞，你每一次都在排除它。沒亮過，不代表可以不看。' },
    { who: 'sys', text: '碼頭那邊有人跑進來：一艘貨船剛靠岸，有個人下跳板的時候喘不過氣，走不到公會。' },
    { who: 'mentor', text: '這一張是出診。把包背上，鐘我來拿。' },
  ] },
  { id: 'ch1-complete', title: '第一章　完', when: (s) => !!s.cases.c01a && !!s.cases.c01b && !!s.cases.c01c && !!s.cases.c01d, lines: [
    { who: 'mo', text: '四盞燈，四個人。鐵翅蛾這一頁寫回來了。' },
    { who: 'mentor', text: '同一句「胸口痛」，一個要馬上叫人，一個可以回家，一個不能放走，一個差點被當成緊張。' },
    { who: 'mentor', text: '第一章到這裡。下一頁是別的症影，還在整理，好了會貼到委託板上。' },
    { who: 'sys', text: '你升為「巡診專科護理師」。' },
  ] },
  { id: 'ch2-open', title: '第二章　同一張面孔', when: (s) => !!s.cases.c01a && !!s.cases.c01b && !!s.cases.c01c && !!s.cases.c01d, lines: [
    { who: 'mo', text: '下一頁有兩隻。一隻肚子像風箱，一鼓一縮；一隻把繩子打成結，抱在懷裡不放。' },
    { who: 'mentor', text: '風箱蛙是喘，結繩蟹是腹痛。這兩隻最會騙人：來的人講的話都差不多，底下卻完全不一樣。' },
    { who: 'mentor', text: '流程你已經熟了。這一章要練的是聽：同樣一句「我很喘」「我肚子痛」，要問到它們不一樣的地方。' },
    { who: 'sys', text: '委託板上多了兩張新的。' },
  ] },
  { id: 'ch2-half', title: '第二章　寫回一半', when: (s) => !!s.cases.c02a && !!s.cases.c02b && !!s.cases.c03a && !!s.cases.c03b, lines: [
    { who: 'mo', text: '兩頁各寫回了一半。風箱蛙還有「肺部感染」和「突發急症」，結繩蟹還有「胰臟與胃」和「大腸憩室」，底下都還沒有人名。' },
    { who: 'mentor', text: '一個是水，一個是氣；一個吃完油的才痛，一個從肚臍開始痛。這些差別，都是你自己問出來的。' },
    { who: 'mentor', text: '剩下的四盞，委託已經送到了。有兩位不太穩，你要一邊問、一邊看著他們。' },
  ] },
  { id: 'ch2-complete', title: '第二章　完', when: (s) => ['c02a', 'c02b', 'c02c', 'c02d', 'c03a', 'c03b', 'c03c', 'c03d'].every((id) => !!s.cases[id]), lines: [
    { who: 'mo', text: '風箱蛙四盞，結繩蟹四盞，都有人名了。圖鑑寫回了三頁。' },
    { who: 'mentor', text: '八個人，講的幾乎是同樣兩句話：「我很喘」「我肚子痛」。你問到了他們不一樣的地方。' },
    { who: 'mentor', text: '還有一件事：最後那一位怕的不是痛。她怕什麼，不問是聽不到的。' },
    { who: 'mentor', text: '第二章到這裡。' },
  ] },
  { id: 'rank-duty', title: '升階　值班專科護理師', when: (s) => tierOf(s) === 1, lines: [
    { who: 'mentor', text: '從今天起，你是值班專科護理師。披肩不換，換的是我幫你的方式。' },
    { who: 'mentor', text: '以前我會先告訴你，一條線索是讓某個真身更像，還是比較不像。現在這一步你自己來。' },
    { who: 'mentor', text: '還有，一張委託我只回答你三次。想清楚再問。' },
    { who: 'mo', text: '舊的委託也可以重接。同一位病人，少了提示，你看到的東西會不一樣。' },
  ] },
  { id: 'ch3-open', title: '第三章　被蓋掉的紀錄', when: (s) => tierOf(s) === 1, lines: [
    { who: 'mo', text: '我在淹過水的櫃子底下，找到一疊舊索引。每一張上面只有一行字：「著涼」「年紀大了」「老毛病」。然後就歸檔了。' },
    { who: 'mo', text: '這一疊對到兩隻症影。一隻背上的炭一明一滅，是發燒；一隻停在人頭上一下一下地啄，是頭痛。' },
    { who: 'mentor', text: '太早寫下的結論，會把後面的線索都蓋掉。這一章，你把這幾張重新打開。' },
    { who: 'mentor', text: '不過記住：舊索引不一定都寫錯。對的，你要替它找到憑據；錯的，你要說得出錯在哪裡。' },
    { who: 'sys', text: '委託板上多了兩張新的。' },
  ] },
  { id: 'ch3-half', title: '第三章　打開了四張', when: (s) => ['c04a', 'c04b', 'c05a', 'c05b'].every((id) => !!s.cases[id]), lines: [
    { who: 'mo', text: '四張舊索引，三張劃掉重寫，一張底下補了憑據。' },
    { who: 'mentor', text: '兩張「老毛病」，一張是對的，一張差一點出事。差別不在那三個字，在寫的人有沒有查過。' },
    { who: 'mentor', text: '餘燼蜥還有兩盞沒有人名，篤篤鳥也是。那幾張還在整理。' },
  ] },
];
export const nextBeat = (s: Save) => BEATS.find((b) => !s.beats.includes(b.id) && b.when(s));

const chapterDone = (n: number, s: Save) => QUESTS.filter((q) => q.chapter === n).every((q) => s.cases[q.caseId]);
/** 階級只代表提示少了幾層，不加任何數值。第一章走完是巡診，第二章走完是值班 */
export const rankOf = (s: Save) => (!chapterDone(1, s) ? '見習專科護理師' : !chapterDone(2, s) ? '巡診專科護理師' : '值班專科護理師');
/** 提示拿掉了幾層：升到值班之後拿掉第一層 */
export const tierOf = (s: Save): 0 | 1 => (chapterDone(1, s) && chapterDone(2, s) ? 1 : 0);

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

// ── 人物和場景的圖鑑 ──
// 遇到了、去過了才會打開。全部從存檔算出來，沒有另外記。

/** 主角：三位見習專科護理師。只有外表和帶的東西不同，能做的事一模一樣 */
export const HEROES = [
  { id: 'cheng', name: '葉澄', tag: '內科病房出身', line: '習慣把每一件事寫下來，筆記本從不離手。' },
  { id: 'yuan', name: '高遠', tag: '急診出身', line: '手腳很快，正在學慢下來把話問完。巡夜的時候提著一盞小燈。' },
  { id: 'zhi', name: '白芷', tag: '社區巡診出身', line: '很會聽人說話。出診包裡總有一把剛採的草藥。' },
  { id: 'heng', name: '杜衡', tag: '外科病房出身', line: '手很穩，話很少。口袋裡永遠有一捲繃帶。' },
  { id: 'mu', name: '蘇木', tag: '兒科病房出身', line: '會蹲下來跟孩子說話。手上那隻布做的小魚，是哄人用的。' },
  { id: 'qiao', name: '連翹', tag: '加護病房出身', line: '習慣看著懷錶數呼吸。別人慌的時候，她的聲音會慢下來。' },
] as const;
export const heroOf = (id: string | null) => HEROES.find((h) => h.id === id) ?? HEROES[0];
const heroShot = (id: string): Shot => ({ kind: 'hall', hero: id, view: { w: 112, h: 112, cx: 189, cy: 212 } });
export const heroShots = Object.fromEntries(HEROES.map((h) => [h.id, heroShot(h.id)])) as Record<string, Shot>;

export interface Entry { id: string; name: string; tag: string; lines: string[]; shot: Shot; open: boolean; hint: string }
const face = (cx: number, cy: number, w = 104): Shot['view'] => ({ w, h: w, cx, cy });

/** 人物：公會的人，和你照顧過的病人 */
export function peopleOf(save: Save): { guild: Entry[]; patients: Entry[] } {
  const any = Object.keys(save.cases).length > 0;
  const guild: Entry[] = [
    { id: 'cen', name: '岑禾', tag: '資深專科護理師', lines: ['帶你的人。話不多，問的問題都很準。', '她的紀錄板上，每一位病人只寫三行。'], shot: { kind: 'ward', view: face(297, 178) }, open: true, hint: '' },
    { id: 'mo', name: '眠墨', tag: '公會的檔案員', lines: ['管圖鑑的人。檔案室淹水的那一夜，他搶救到天亮。', '舊索引上「一症一解」的那幾行，是他親手劃掉的。'], shot: { kind: 'hall', view: face(74, 152) }, open: true, hint: '' },
    { id: 'shen', name: '沈渡', tag: '值班醫師', lines: ['值班鐘一響就會出現。', '他只說一句：「告訴我重點。」'], shot: { kind: 'ward', doctor: true, view: face(326, 170) }, open: any, hint: '完成第一張委託之後' },
  ];
  const after: Record<string, string> = {
    c01a: '後來他把菸戒了。那一晚，女兒自己守完了燈。',
    c01b: '那一船貨，她隔了三天才回去卸。現在會催同事來公會。',
    c01c: '檢查的結果，他是自己先聽的。過了兩天，才帶兒子一起來。',
    c01d: '帳冊有人幫她收好了。那一趟船，是別人代她出的海。',
    c02a: '藥調好之後，腳消了。孫子出海那天，他自己走到了碼頭。',
    c02b: '那一批魚是徒弟出的貨。他回到坊裡，把菸斗掛在牆上，沒有再點。',
    c03a: '攤子歇了十天。再開張的時候，滷肥肉從菜單上劃掉了。',
    c03b: '師傅沒有不要他。工寮的人輪流送了一個禮拜的粥。',
    c02c: '大拍賣是老陳代的。他躺在病室裡聽人轉述，一邊聽一邊糾正喊價的節奏。',
    c02d: '三個月後他回到桅杆上。口袋裡那包菸，換成了一小袋炒豆子。',
    c03c: '那幾缸酒是徒弟顧出來的。之後試酒，他只含一口，再吐掉。',
    c03d: '發炎好了之後，她做了那個一直不敢做的檢查。出來的時候，她買了一袋青菜回麵包坊。',
    c04a: '網子是隔壁的阿嬸交的。她現在補網的凳子旁邊，多了一只水壺。',
    c04b: '腳保住了。孫女每天晚上幫他看一次腳底，他嘴上嫌煩，襪子倒是自己先脫好。',
    c05a: '她在帳冊的最後一頁記下每一次頭痛的日子。亮線再出現的時候，她先去把燈調暗。',
    c05b: '兒子的親事延了兩個月。那一天她坐在主桌，是自己走進去的。',
  };
  const patients: Entry[] = CASES.map((c) => {
    const rec = save.cases[c.id], truth = c.forms.find((f) => f.id === c.answer.truth)!;
    return {
      id: c.id, name: c.patient.name, tag: c.patient.age + ' 歲，' + c.patient.job,
      lines: [rec?.found ? '真身：' + truth.name + '。' : '真身還沒有認出來。', ...(after[c.id] ? [after[c.id]] : [])],
      shot: { kind: 'ward', patient: c.patient.look, scene: c.scene, view: face(92, 170) }, open: !!rec, hint: '完成「' + c.title + '」之後',
    };
  });
  return { guild, patients };
}

/** 場景：去過的地方。最後兩個是之後的章節才會去的 */
export function placesOf(save: Save): Entry[] {
  const any = Object.keys(save.cases).length > 0;
  return [
    { id: 'hall', name: '公會大廳', tag: '霧港', lines: ['委託板、眠墨的櫃台、看得到燈塔的拱窗。每一張委託從這裡開始，也回到這裡。'], shot: { kind: 'hall' }, open: true, hint: '' },
    { id: 'ward', name: '公會的病室', tag: '大廳旁邊那扇門', lines: ['一張床、一張桌子、一口值班鐘。窗台上那隻貓不屬於任何人。', '下雨天，窗外的樹會安靜下來。'], shot: { kind: 'ward', patient: 'lin' }, open: any, hint: '完成第一張委託之後' },
    { id: 'dock', name: '碼頭的貨棧', tag: '出診', lines: ['船一靠岸，走不到公會的人就先扶進這裡。', '出診的時候，岑禾會把值班鐘一起帶來，掛在樑上。'], shot: { kind: 'ward', patient: 'zhou', scene: 'dock' }, open: !!save.cases.c01d, hint: '完成「靠岸的那天早上」之後' },
    { id: 'tower', name: '燈塔的值夜房', tag: '還沒去過', lines: [], shot: { kind: 'hall' }, open: false, hint: '之後的章節' },
    { id: 'yard', name: '船塢的工寮', tag: '還沒去過', lines: [], shot: { kind: 'hall' }, open: false, hint: '之後的章節' },
  ];
}

/** 症影那一頁整體寫回了多少：每隻症影的百分比平均 */
export const codexPercent = (list: ComplaintDef[], save: Save) => (list.length ? Math.round(list.reduce((n, m) => n + codexOf(m, save).percent, 0) / list.length) : 0);

/** 人物和場景加起來打開了幾個 */
export function albumCount(save: Save): { got: number; total: number } {
  const { guild, patients } = peopleOf(save), all = [...guild, ...patients, ...placesOf(save)];
  return { got: all.filter((e) => e.open).length + HEROES.length, total: all.length + HEROES.length };
}
