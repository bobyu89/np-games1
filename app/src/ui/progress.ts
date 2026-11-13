// 長期的推進：委託怎麼解鎖、故事什麼時候往下走、圖鑑怎麼被寫回來、階級怎麼升。
// 全部從「玩過哪些病例、解讀對哪些線索」算出來，沒有另外的經驗值。
import type { CaseDef, Score, Session } from '../core/types.ts';
import type { ComplaintDef } from '../core/module.ts';
import { harvest } from '../core/scoring.ts';
import { CASES } from '../data/index.ts';
import { AFTER_MORE } from '../data/extras.ts';
import type { Line } from './Talk.tsx';
import type { CaseRecord, Save, TrialRecord } from './store.ts';
import type { Shot } from './Portrait.tsx';

/** 委託板上的一張委託。needs：要先完成哪一張才會出現 */
export interface Quest { caseId: string; chapter: number; needs?: string | string[] }
export const QUESTS: Quest[] = [{ caseId: 'c01a', chapter: 1 }, { caseId: 'c01b', chapter: 1, needs: 'c01a' }, { caseId: 'c01c', chapter: 1, needs: 'c01b' }, { caseId: 'c01d', chapter: 1, needs: 'c01c' },
  // 第二章：第一章走完才會貼上板子。兩隻症影可以交錯著接
  { caseId: 'c02a', chapter: 2, needs: 'c01d' }, { caseId: 'c02b', chapter: 2, needs: 'c02a' }, { caseId: 'c02c', chapter: 2, needs: 'c02b' }, { caseId: 'c02d', chapter: 2, needs: 'c02c' },
  { caseId: 'c03a', chapter: 2, needs: 'c01d' }, { caseId: 'c03b', chapter: 2, needs: 'c03a' }, { caseId: 'c03c', chapter: 2, needs: 'c03b' }, { caseId: 'c03d', chapter: 2, needs: 'c03c' },
  // 第三章：第二章的八張都走完才會貼上板子
  { caseId: 'c04a', chapter: 3, needs: ['c02d', 'c03d'] }, { caseId: 'c04b', chapter: 3, needs: 'c04a' }, { caseId: 'c04c', chapter: 3, needs: 'c04b' }, { caseId: 'c04d', chapter: 3, needs: 'c04c' },
  { caseId: 'c05a', chapter: 3, needs: ['c02d', 'c03d'] }, { caseId: 'c05b', chapter: 3, needs: 'c05a' }, { caseId: 'c05c', chapter: 3, needs: 'c05b' }, { caseId: 'c05d', chapter: 3, needs: 'c05c' },
  // 第四章：第三章的八張都走完才會貼上板子。第五章：第四章的十二張都走完
  { caseId: 'c06a', chapter: 4, needs: ['c04d', 'c05d'] }, { caseId: 'c06b', chapter: 4, needs: 'c06a' }, { caseId: 'c06c', chapter: 4, needs: 'c06b' }, { caseId: 'c06d', chapter: 4, needs: 'c06c' },
  { caseId: 'c07a', chapter: 4, needs: ['c04d', 'c05d'] }, { caseId: 'c07b', chapter: 4, needs: 'c07a' }, { caseId: 'c07c', chapter: 4, needs: 'c07b' }, { caseId: 'c07d', chapter: 4, needs: 'c07c' },
  { caseId: 'c08a', chapter: 4, needs: ['c04d', 'c05d'] }, { caseId: 'c08b', chapter: 4, needs: 'c08a' }, { caseId: 'c08c', chapter: 4, needs: 'c08b' }, { caseId: 'c08d', chapter: 4, needs: 'c08c' },
  { caseId: 'c09a', chapter: 5, needs: ['c06d', 'c07d', 'c08d'] }, { caseId: 'c09b', chapter: 5, needs: 'c09a' }, { caseId: 'c09c', chapter: 5, needs: 'c09b' }, { caseId: 'c09d', chapter: 5, needs: 'c09c' },
  { caseId: 'c10a', chapter: 5, needs: ['c06d', 'c07d', 'c08d'] }, { caseId: 'c10b', chapter: 5, needs: 'c10a' }, { caseId: 'c10c', chapter: 5, needs: 'c10b' }, { caseId: 'c10d', chapter: 5, needs: 'c10c' },
  { caseId: 'c11a', chapter: 5, needs: ['c06d', 'c07d', 'c08d'] }, { caseId: 'c11b', chapter: 5, needs: 'c11a' }, { caseId: 'c11c', chapter: 5, needs: 'c11b' }, { caseId: 'c11d', chapter: 5, needs: 'c11c' },
  { caseId: 'c12a', chapter: 5, needs: ['c06d', 'c07d', 'c08d'] }, { caseId: 'c12b', chapter: 5, needs: 'c12a' }, { caseId: 'c12c', chapter: 5, needs: 'c12b' }, { caseId: 'c12d', chapter: 5, needs: 'c12c' }];
export const unlocked = (q: Quest, s: Save) => [q.needs ?? []].flat().every((id) => !!s.cases[id]);

/** 故事的一段。條件成立、而且還沒看過，回到公會的時候就會播 */
export interface Beat { id: string; title: string; when(s: Save): boolean; lines: Line[] }
const has = (s: Save, ids: string[]) => ids.every((id) => !!s.cases[id]);
const CH2 = ['c02a', 'c02b', 'c02c', 'c02d', 'c03a', 'c03b', 'c03c', 'c03d'], CH3 = ['c04a', 'c04b', 'c04c', 'c04d', 'c05a', 'c05b', 'c05c', 'c05d'];
const CH3_HALF = ['c04a', 'c04b', 'c05a', 'c05b'], CH4_HALF = ['c06a', 'c06b', 'c07a', 'c07b', 'c08a', 'c08b'], CH5_HALF = ['c09a', 'c09b', 'c10a', 'c10b', 'c11a', 'c11b', 'c12a', 'c12b'];

// 故事有兩層。
// 上面一層是每一章要練的事：一隻症影不只一個答案、聽出不一樣的地方、太早寫下的結論、撐著的人、說不出口的事。
// 底下一層是一條線：圖鑑最前面被拆走的那一頁。十五年前的冬天霧四十天沒有散，忍冬寫了「一隻症影一行字」的索引，
// 見習的岑禾照著它讓一個人回去，沈渡簽了名，眠墨把後來那一頁勘誤拆下來藏了十五年。沒有壞人；每個人都只省了一步。
// {you}、{greet}、{habit}、{own} 在大廳換成玩家選的那一位（toYou）。
export const BEATS: Beat[] = [
  // 序章要交代四件事：這是哪裡、你是誰、出了什麼事、你要做什麼
  { id: 'prologue', title: '序章　遺失的一頁', when: () => true, lines: [
    { who: 'sys', text: '霧港。依山傍海的港城，一年裡有大半的日子起霧。' },
    { who: 'sys', text: '幾十年前，這裡的霧開始會凝成形狀。人在痛、在喘、說不清自己怎麼了的時候，身邊會浮出一團有形的霧。港城的人叫它「症影」。' },
    { who: 'sys', text: '霧脈公會，是港城的人不舒服的時候會來的地方。你，{you}，剛結束訓練，今天第一天來報到。' },
    { who: 'mentor', text: '{you}？我是岑禾，在這裡值班十幾年了。{greet}' },
    { who: 'mentor', text: '櫃台後面寫字的是眠墨，管檔案室。值班的醫師叫沈渡；敲值班鐘，他就會來。' },
    { who: 'mo', text: '……抱歉，沒辦法好好招呼你。檔案室昨晚淹水了。圖鑑只救回症影的外形，底下寫的字都糊掉了。' },
    { who: 'mo', text: '還有一件事。清點的時候才發現，最前面少了一頁。不是泡爛的；裝訂的線頭是舊的，很久以前就被人拆走了。' },
    { who: 'mentor', text: '……那一頁以後再說。先顧眼前的。' },
    { who: 'mentor', text: '圖鑑是前人一筆一筆記下來的：每一種症影，背後可能是哪幾種病，該問什麼，什麼時候不能等。現在只剩圖。從今天起，每一位進來的人都要重新看，一頁一頁寫回來。' },
    { who: 'mentor', text: '記住一件事：症影只告訴你「哪裡不舒服」，不告訴你「為什麼」。同一隻症影，背後可能是四種完全不同的病。' },
    { who: 'mentor', text: '你要做的事，和受訓的時候學的一樣：問診、身體評估、下診斷、提出檢查、向醫師回報、跟病人說明。我在旁邊；卡住了就問我。' },
    { who: 'mentor', text: '板子上那張蓋了紅蠟的，是剛送來的。去看看吧。' },
  ] },
  { id: 'ch1-second', title: '第一章　鐘聲之前', when: (s) => !!s.cases.c01a, lines: [
    { who: 'mo', text: '胸悶蛾那一頁回來了一半。舊索引上只寫了一行：「胸悶蛾，心」。字很急，墨還沒乾就翻頁了。' },
    { who: 'mentor', text: '一隻症影只配一個答案。那本索引就是這樣害人的。' },
    { who: 'mentor', text: '碼頭又送來一位，同事說「跟林秋那天一樣」。你去看看，是不是真的一樣。' },
  ] },
  { id: 'ch1-third', title: '第一章　同一張面孔', when: (s) => has(s, ['c01a', 'c01b']), lines: [
    { who: 'mo', text: '兩個人，同一隻蛾，兩個診斷。舊索引那一行，我劃掉了。' },
    { who: 'mentor', text: '還沒完。這一頁底下還有兩盞燈，你沒看過它們亮起來的樣子。' },
    { who: 'mentor', text: '有位老船工，胸口悶了一個多月。他不急。你去想清楚：不急的，是不是就不要緊。' },
  ] },
  { id: 'ch1-fourth', title: '第一章　慢慢來的那一隻', when: (s) => has(s, ['c01a', 'c01b', 'c01c']), lines: [
    { who: 'mo', text: '胸悶蛾這一頁，三個診斷底下都有人名了。只剩「血管急症」那一盞，還沒有人讓它亮過。' },
    { who: 'mentor', text: '那一盞，你每一次都在排除它。沒亮過，不代表可以不看。' },
    { who: 'sys', text: '碼頭那邊有人跑進來：一艘貨船剛靠岸，有個人下跳板的時候喘不過氣，走不到公會。' },
    { who: 'mentor', text: '這一張是出診。把包背上，鐘我來拿。' },
  ] },
  { id: 'ch1-complete', title: '第一章　完', when: (s) => chapterDone(1, s), lines: [
    { who: 'mo', text: '四盞燈，四個人。胸悶蛾這一頁寫回來了。' },
    { who: 'mentor', text: '同一句「胸口痛」，一個要馬上叫人，一個可以回家，一個不能放走，一個差點被當成緊張。' },
    { who: 'mo', text: '劃掉舊的那一行的時候，我才看清楚：這本索引有兩種筆跡。一種很穩，一種很年輕。' },
    { who: 'sys', text: '岑禾沒有接話。她走到窗邊，看了一會兒燈塔。', fx: 'window' },
    { who: 'mentor', text: '第一章到這裡。下一頁是別的症影，還在整理，好了會貼到委託板上。', fx: 'window' },
    { who: 'sys', text: '你升為「巡診專科護理師」。' },
  ] },
  { id: 'ch2-open', title: '第二章　同一張面孔', when: (s) => chapterDone(1, s), lines: [
    { who: 'mo', text: '下一頁有兩隻。一隻肚子像風箱，一鼓一縮；一隻把繩子打成結，抱在懷裡不放。' },
    { who: 'mentor', text: '氣促蛙是喘，腹痛蟹是腹痛。這兩隻最會騙人：來的人講的話都差不多，底下卻完全不一樣。' },
    { who: 'mentor', text: '流程你已經熟了。這一章要練的是聽：同樣一句「我很喘」「我肚子痛」，要問到它們不一樣的地方。' },
    { who: 'sys', text: '委託板上多了兩張新的。' },
  ] },
  { id: 'ch2-half', title: '第二章　三行', when: (s) => has(s, ['c02a', 'c02b', 'c03a', 'c03b']), lines: [
    { who: 'mo', text: '兩頁各寫回了一半。氣促蛙還有「肺部感染」和「突發急症」，腹痛蟹還有「胰臟與胃」和「大腸憩室」，底下都還沒有人名。' },
    { who: 'mentor', text: '一個是水，一個是氣；一個吃完油的才痛，一個從肚臍開始痛。這些差別，都是你自己問出來的。' },
    { who: 'sys', text: '你瞄到岑禾的紀錄板。每一位病人，她只寫三行。' },
    { who: 'mentor', text: '第一行，他說的。第二行，我看到的。第三行，還不知道的。' },
    { who: 'mentor', text: '第三行不能空著。空著，就是你以為自己都知道了。' },
    { who: 'mentor', text: '剩下的四盞，委託已經送到了。有兩位不太穩，你要一邊問、一邊看著他們。' },
  ] },
  { id: 'ch2-complete', title: '第二章　完', when: (s) => has(s, CH2), lines: [
    { who: 'mo', text: '氣促蛙四盞，腹痛蟹四盞，都有人名了。圖鑑寫回了三頁。' },
    { who: 'mentor', text: '八個人，講的幾乎是同樣兩句話：「我很喘」「我肚子痛」。你問到了他們不一樣的地方。' },
    { who: 'mentor', text: '還有一件事：最後那一位怕的不是痛。她怕什麼，不問是聽不到的。' },
    { who: 'mentor', text: '第二章到這裡。' },
  ] },
  { id: 'rank-duty', title: '升階　值班專科護理師', when: (s) => tierOf(s) === 1, lines: [
    { who: 'mentor', text: '從今天起，你是值班專科護理師。披肩不換，換的是我幫你的方式。' },
    { who: 'mentor', text: '以前我會先告訴你，一條線索是讓某個診斷更像，還是比較不像。現在這一步你自己來。' },
    { who: 'mentor', text: '還有，一張委託我只回答你三次。想清楚再問。' },
    { who: 'mentor', text: '{habit}' },
    { who: 'mo', text: '舊的委託也可以重接。同一位病人，少了提示，你看到的東西會不一樣。' },
  ] },
  { id: 'ch3-open', title: '第三章　被蓋掉的紀錄', when: (s) => tierOf(s) === 1, lines: [
    { who: 'mo', text: '我在淹過水的櫃子底下，找到一疊舊索引。每一張上面只有一行字：「著涼」「年紀大了」「老毛病」。然後就歸檔了。' },
    { who: 'mo', text: '這一疊對到兩隻症影。一隻背上的炭一明一滅，是發燒；一隻停在人頭上一下一下地啄，是頭痛。' },
    { who: 'mo', text: '最底下還壓著一張，不是索引。是一張名單：十一個名字。抬頭被水泡掉了，只剩半個字。', fx: 'page' },
    { who: 'mentor', text: '……那一張先收著。', fx: 'page' },
    { who: 'mentor', text: '太早寫下的結論，會把後面的線索都蓋掉。這一章，你把這幾張重新打開。' },
    { who: 'mentor', text: '不過記住：舊索引不一定都寫錯。對的，你要替它找到憑據；錯的，你要說得出錯在哪裡。' },
    { who: 'sys', text: '委託板上多了兩張新的。' },
  ] },
  { id: 'ch3-half', title: '第三章　落款', when: (s) => has(s, CH3_HALF), lines: [
    { who: 'mo', text: '四張舊索引，三張劃掉重寫，一張底下補了憑據。' },
    { who: 'mentor', text: '兩張「老毛病」，一張是對的，一張差一點出事。差別不在那三個字，在寫的人有沒有查過。' },
    { who: 'mentor', text: '發熱蜥還有兩盞沒有人名，頭痛鳥也是。剩下的四張，眠墨剛從櫃子底下翻出來。' },
    { who: 'mo', text: '這四張寫的是：「感冒，還沒好」「感染沒清乾淨」「宿醉」「更年期」。有一張，底下還多補了一行。' },
    { who: 'mo', text: '補的那一行是：「錯了。重看。」落款只有一個字：冬。' },
    { who: 'mentor', text: '忍冬。我的老師。這本索引，是她寫的。' },
  ] },
  { id: 'ch3-complete', title: '第三章　完', when: (s) => has(s, CH3), lines: [
    { who: 'mo', text: '八張舊索引都重新打開了。七張劃掉重寫，一張底下補了憑據。' },
    { who: 'mentor', text: '這些字不是亂寫的。「感冒」「宿醉」「更年期」，十次裡有九次是對的。危險的是第十次，還有寫完就不再看的那個習慣。' },
    { who: 'mentor', text: '有一張的答案是「不是感染」，有一張是「真的只是老毛病」。把東西排除掉，跟把東西找出來，一樣是本事。' },
    { who: 'mo', text: '……那張名單，我把抬頭拼回來了。兩個字：「勘誤」。', fx: 'page' },
    { who: 'mo', text: '你報到那天，我說最前面那一頁「被人拆走了」。那個人是我。十五年前，公會說圖鑑不能有勘誤，要我拆下來燒掉。我拆了，沒有燒。', fx: 'page dusk' },
    { who: 'mentor', text: '第三章到這裡。' },
  ] },
  { id: 'ch4-open', title: '第四章　撐著走來的人', when: (s) => chapterDone(3, s), lines: [
    { who: 'mo', text: '這一頁開始，圖鑑上多了三隻：背上馱著石頭的龜、只用一隻腳站的鷺、一碰就鼓起來的豚。背痛、腳痛、腫。' },
    { who: 'mentor', text: '這一章來的人，都是撐著、拖著才來的。能撐，不代表不要緊。' },
    { who: 'mentor', text: '一樣是痛、一樣是腫，你要分出哪一個不能等。方法很土：把兩邊比一比，把該脫的鞋襪脫掉看。' },
    { who: 'sys', text: '委託板上多了三張新的。' },
  ] },
  { id: 'ch4-half', title: '第四章　四十天', when: (s) => has(s, CH4_HALF), lines: [
    { who: 'sys', text: '值班鐘沒有響，沈渡卻自己走進了大廳。他看了一眼櫃台上那張名單。', fx: 'shen' },
    { who: 'doctor', text: '十五年前的冬天，霧四十天沒有散。船出不去，人一直進來。值班的只有三個：忍冬、我，還有一個見習。', fx: 'shen dusk' },
    { who: 'doctor', text: '忍冬寫了那本索引。一隻症影一行字，讓誰來都能先分出輕重。那個冬天，它救了很多人。', fx: 'shen dusk' },
    { who: 'doctor', text: '我負責簽名。四十天，我簽了幾百張，沒有一張是看過才簽的。', fx: 'shen dusk' },
    { who: 'doctor', text: '所以我現在只問一句：「告訴我重點。」問了，我就得聽完。', fx: 'shen' },
    { who: 'sys', text: '他沒有說那個見習是誰。', fx: 'shen' },
  ] },
  { id: 'ch4-complete', title: '第四章　完', when: (s) => chapterDone(4, s), lines: [
    { who: 'mo', text: '三隻症影，十二盞燈，都有人名了。' },
    { who: 'mentor', text: '他們進門的時候，幾乎都說「還撐得住」。裡面有幾位，是用鐘頭在算的。' },
    { who: 'mentor', text: '十五年前，也有一個人這樣說。守燈塔的檜伯。第三十一天，他自己從塔上走下來的。', fx: 'dusk' },
    { who: 'mentor', text: '我那時候是見習。我看了索引，寫了一行字，讓他回去。', fx: 'dusk' },
    { who: 'mentor', text: '那天晚上，燈塔沒有亮。', fx: 'dusk dark' },
    { who: 'mentor', text: '勘誤上的第十一個名字是他。那一行字，是我的筆跡。', fx: 'dusk dark page' },
    { who: 'you', text: '{own}', fx: 'dusk' },
    { who: 'mentor', text: '這一句「還撐得住」，你以後聽到，要多看一眼：看另一邊、看襪子底下、看他是怎麼走進來的。' },
    { who: 'mentor', text: '第四章到這裡。' },
  ] },
  { id: 'ch5-open', title: '第五章　說不出口的事', when: (s) => chapterDone(4, s), lines: [
    { who: 'mo', text: '最後這四頁，我一直壓在最底下：排泄物、疹子、瘦了、麻了。來的人自己都講不清楚。' },
    { who: 'mentor', text: '有些是不好意思說，有些是不知道怎麼說。要問，他才會說；怎麼問，決定他說不說。' },
    { who: 'mentor', text: '簾子拉好，話說慢一點。該看的地方要看；看之前，先讓他知道為什麼。' },
    { who: 'mentor', text: '說不出口的，不只是病人。那張勘誤，我們三個人十五年沒有提過一個字。' },
    { who: 'sys', text: '委託板上多了四張新的。' },
  ] },
  { id: 'ch5-half', title: '第五章　第十二行', when: (s) => has(s, CH5_HALF), lines: [
    { who: 'mo', text: '勘誤我重新抄了一份。原來那張有十二行：十一個名字，第十二行是空的。', fx: 'page page12' },
    { who: 'mo', text: '空行旁邊有一行小字，是忍冬的筆跡：「留給下一個寫這本圖鑑的人。」', fx: 'page page12' },
    { who: 'mentor', text: '冬天過完，她要把這一頁訂在索引的最前面。公會不肯。她把值班鐘交回來，上了燈塔。檜伯走了，燈總要有人顧。', fx: 'dusk' },
    { who: 'mentor', text: '十五年，那盞燈沒有熄過。她也沒有下來過。', fx: 'window' },
    { who: 'mentor', text: '她留的不是一個位置，是一條規矩：錯了，寫上去，放在第一頁。' },
  ] },
  { id: 'ch5-complete', title: '第五章　完', when: (s) => chapterDone(5, s), lines: [
    { who: 'mo', text: '十二隻症影，四十八盞燈。舊索引上的一行字，一行一行都改寫完了。' },
    { who: 'mentor', text: '你現在看到一隻症影，想到的不是一個答案，是四個方向，還有哪一個不能漏。' },
    { who: 'mo', text: '新的圖鑑，我把勘誤訂回第一頁了。十一個名字都在。第十二行，還是空的。', fx: 'page page12' },
    { who: 'mentor', text: '希望你永遠用不到那一行。可是如果有那一天：寫上去，不要拆。', fx: 'page page12' },
    { who: 'sys', text: '眠墨抄了一份新圖鑑的目錄，託送燈油的人帶上燈塔。三天後，回信只有一行。' },
    { who: 'sys', text: '「第三行，還寫嗎？」', fx: 'window' },
    { who: 'sys', text: '岑禾看了很久。然後她拿起紀錄板，寫下今天的第三行。', fx: 'window' },
    { who: 'mentor', text: '圖鑑寫完了，可是來的人不會照著圖鑑生病。接下來是值班夜：兩張委託同時送到的時候，你先看哪一張？' },
    { who: 'sys', text: '（後面的章節還在整理。）' },
  ] },
];

/** 舊檔案：忍冬在四十天霧那個冬天寫的值班日誌。想知道更多的人可以在圖鑑裡慢慢讀；不讀也不影響玩 */
export interface Leaf { id: string; day: string; hint: string; when(s: Save): boolean; lines: string[] }
export const ARCHIVE: Leaf[] = [
  { id: 'log-03', day: '第三天', hint: '第一章走完之後', when: (s) => chapterDone(1, s), lines: ['霧沒有散。出海的船都叫回來了。', '病室六張床，躺了十一個人。值班的三個：我、沈渡、新來的見習。見習的手很快，字很好看。'] },
  { id: 'log-09', day: '第九天', hint: '第二章走完之後', when: (s) => has(s, CH2), lines: ['人太多，來不及一個一個教。我寫了一本索引給見習用：一隻症影，一行字，先分出誰不能等。', '沈渡說這樣太粗。我說，粗的網也比沒有網好。'] },
  { id: 'log-17', day: '第十七天', hint: '第三章走到一半之後', when: (s) => has(s, CH3_HALF), lines: ['索引好用。今天進來六十一個人，急的一個都沒有漏。', '見習不再跑來問我了。她看索引。我本來應該覺得輕鬆。'] },
  { id: 'log-31', day: '第三十一天', hint: '第四章走到一半之後', when: (s) => has(s, CH4_HALF), lines: ['守燈塔的檜伯自己從塔上走下來。他說不太舒服，還撐得住；塔上沒有人不行。', '見習看了索引，寫了一行，讓他回去。我在隔壁縫一個傷口，沒有過去看。'] },
  { id: 'log-32', day: '第三十二天', hint: '第四章走完之後', when: (s) => chapterDone(4, s), lines: ['昨天夜裡，燈塔沒有亮。', '早上去的人說，燈油是滿的。'] },
  { id: 'log-40', day: '第四十天', hint: '第五章走到一半之後', when: (s) => has(s, CH5_HALF), lines: ['霧散了。我把四十天的紀錄從頭看了一遍。索引寫錯的，十一個。', '十一個名字，我抄成一頁，要訂在最前面。見習的那一行我沒有劃掉。那不是她一個人寫的：索引是我的，簽名是沈渡的。'] },
  { id: 'log-after', day: '之後', hint: '第五章走完之後', when: (s) => chapterDone(5, s), lines: ['公會說，圖鑑不能有勘誤，不然沒有人敢來。', '索引不是錯在快。錯在它讓人不再問。', '鐘我交回去了。檜伯的燈，我去顧。第十二行留著。'] },
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

// ── 資格試煉 ──
// 照甄審口試的條件走一次：用抽的、站內 15 分鐘照真的時間倒數、沒有提示、交卷之後才有回顧。
// 不寫圖鑑，也不算完成委託；只留一筆成績。
export const TRIAL_SECONDS = 15 * 60, TRIAL_WARN = 3 * 60, TRIAL_PASS = 60;
/** 第一章走完才開放：先在有人帶的情況下把流程走熟 */
export const trialOpen = (s: Save) => chapterDone(1, s);
/** 抽一位病人。四十八位都可能出，沒遇過的比較容易抽到；不會連續兩次抽到同一位。r 是 0 到 1 的亂數 */
export function pickTrial(s: Save, r: number): CaseDef {
  const last = s.trials[0]?.caseId, pool = CASES.filter((c) => c.id !== last || CASES.length === 1);
  const weight = (c: CaseDef) => (s.cases[c.id] || s.trials.some((t) => t.caseId === c.id) ? 1 : 3);
  let at = Math.min(0.999999, Math.max(0, r)) * pool.reduce((n, c) => n + weight(c), 0);
  for (const c of pool) { at -= weight(c); if (at < 0) return c; }
  return pool[pool.length - 1];
}
/** 把一場試煉的結果記進存檔（新的在前面，最多留 30 筆） */
export function recordTrial(save: Save, c: CaseDef, session: Session, score: Score, seconds: number, timeUp: boolean, at: number): Save {
  const rec: TrialRecord = { at, caseId: c.id, score: Math.round(score.total), safety: score.safety, seconds, timeUp, found: harvest(c, session).found };
  return { ...save, trials: [rec, ...save.trials].slice(0, 30) };
}

/** 這一場新寫進圖鑑的線索（之前沒有解讀對過的） */
export function newReads(save: Save, c: CaseDef, session: Session) {
  const had = save.cases[c.id]?.reads ?? [];
  return harvest(c, session).reads.filter((r) => !had.some((k) => k.clue === r.clue));
}

/** 圖鑑的一頁：一隻症影、四個診斷、你在不同病人身上解讀對的線索 */
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
  { id: 'cheng', name: '葉澄', tag: '內科病房出身', line: '習慣把每一件事寫下來，筆記本從不離手。', greet: '內科病房來的？寫紀錄的習慣留著，這裡用得上。',
    habit: '還有你自己的習慣。你什麼都寫下來；可是寫得很滿的筆記，看起來會像是都問過了。', own: '我的筆記本裡，也有只寫了一行的。' },
  { id: 'yuan', name: '高遠', tag: '急診出身', line: '手腳很快，正在學慢下來把話問完。巡夜的時候提著一盞小燈。', greet: '急診來的？手腳快是好事。在這裡，先學把話問完。',
    habit: '還有你自己的習慣。你快；快的人，最容易在第一個說得通的答案停下來。', own: '急診那幾年，我也讓人回去過。有幾位，我不知道後來怎麼了。' },
  { id: 'zhi', name: '白芷', tag: '社區巡診出身', line: '很會聽人說話。出診包裡總有一把剛採的草藥。', greet: '社區巡診來的？會聽人說話，就已經贏一半了。',
    habit: '還有你自己的習慣。你會聽；可是有些事光聽是聽不到的，要把手放上去。', own: '巡診的時候，很多人跟我說還撐得住。我都信了。' },
  { id: 'heng', name: '杜衡', tag: '外科病房出身', line: '手很穩，話很少。口袋裡永遠有一捲繃帶。', greet: '外科病房來的？手穩很好。話少沒關係，該問的要問出口。',
    habit: '還有你自己的習慣。你手穩，相信自己摸到的；沒摸到的，也要記一筆「還不知道」。', own: '……我沒摸到的，以前都當作沒有。' },
  { id: 'mu', name: '蘇木', tag: '兒科病房出身', line: '會蹲下來跟孩子說話。手上那隻布做的小魚，是哄人用的。', greet: '兒科病房來的？會蹲下來說話的人，大人也願意跟你講。',
    habit: '還有你自己的習慣。你會讓人放心；可是病人放心了，不代表他沒事。', own: '我讓很多人放心地回去了。後來怎麼了，我很少回頭去問。' },
  { id: 'qiao', name: '連翹', tag: '加護病房出身', line: '習慣看著懷錶數呼吸。別人慌的時候，她的聲音會慢下來。', greet: '加護病房來的？你習慣看數字。在這裡，數字之前先看人。',
    habit: '還有你自己的習慣。你看數字；可是數字還正常的時候，人可能已經不對了。', own: '我也等過數字。等它變了，才肯相信人不對。' },
] as const;
export const heroOf = (id: string | null) => HEROES.find((h) => h.id === id) ?? HEROES[0];
/** 故事裡的 {you}、{greet}、{habit}、{own}：換成玩家選的那一位的名字、岑禾見到他說的第一句話、岑禾提醒他的習慣、他自己說的那一句 */
export const toYou = (text: string, hero: string | null) => { const h = heroOf(hero); return text.replaceAll('{you}', h.name).replaceAll('{greet}', h.greet).replaceAll('{habit}', h.habit).replaceAll('{own}', h.own); };
const heroShot = (id: string): Shot => ({ kind: 'hall', hero: id, view: { w: 112, h: 112, cx: 189, cy: 212 } });
export const heroShots = Object.fromEntries(HEROES.map((h) => [h.id, heroShot(h.id)])) as Record<string, Shot>;

export interface Entry { id: string; name: string; tag: string; lines: string[]; shot: Shot; open: boolean; hint: string }
const face = (cx: number, cy: number, w = 104): Shot['view'] => ({ w, h: w, cx, cy });

/** 人物：公會的人，和你照顧過的病人 */
export function peopleOf(save: Save): { guild: Entry[]; patients: Entry[] } {
  const any = Object.keys(save.cases).length > 0;
  const ch = (n: number) => chapterDone(n, save);
  const guild: Entry[] = [
    { id: 'cen', name: '岑禾', tag: '資深專科護理師', lines: ['帶你的人。話不多，問的問題都很準。', has(save, ['c02a', 'c02b', 'c03a', 'c03b']) ? '她的紀錄板上，每一位病人只寫三行：他說的、她看到的、還不知道的。' : '她的紀錄板上，每一位病人只寫三行。',
      ...(ch(1) ? ['值夜的時候，她會走到窗邊看燈塔。'] : []), ...(ch(4) ? ['十五年前霧四十天沒有散的那個冬天，她是見習。'] : [])], shot: { kind: 'ward', view: face(297, 178) }, open: true, hint: '' },
    { id: 'mo', name: '眠墨', tag: '公會的檔案員', lines: ['管圖鑑的人。檔案室淹水的那一夜，他搶救到天亮。', '舊索引上「一症一解」的那幾行，是他親手劃掉的。',
      ...(has(save, CH3) ? ['最前面被拆走的那一頁，是他拆的。他沒有燒，藏了十五年。'] : []), ...(ch(5) ? ['新的圖鑑，他把那一頁訂回了最前面。'] : [])], shot: { kind: 'hall', view: face(74, 152) }, open: true, hint: '' },
    { id: 'shen', name: '沈渡', tag: '值班醫師', lines: ['值班鐘一響就會出現。', '他只說一句：「告訴我重點。」',
      ...(has(save, CH4_HALF) ? ['這一句，是四十天霧之後才開始問的。問了，他就會聽完。'] : [])], shot: { kind: 'ward', doctor: true, view: face(326, 170) }, open: any, hint: '完成第一張委託之後' },
    { id: 'dong', name: '忍冬', tag: '寫舊索引的人', lines: ['岑禾的老師。十五年前的冬天，她寫出了那本「一隻症影一行字」的索引。', ...(has(save, CH5_HALF) ? ['現在守著燈塔。那盞燈十五年沒有熄過，她也沒有下來過。'] : ['沒有人說她後來去了哪裡。'])],
      shot: { kind: 'hall', view: face(87, 84, 62) }, open: has(save, CH3_HALF), hint: '第三章走到一半之後' },
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
    c04c: '他在單獨的房間住了一陣子。半年後回到船上，還是廚子；同艙的七個人都去照了片子。',
    c04d: '藥停掉的第三天，燒退了。他的紀錄上多了一行紅字，藥鋪的櫃台上也貼了一張。',
    c05c: '他在第九天認得出同伴。母親是他自己寫信去說的，信裡只寫了：「生了一場病，好了。」',
    c05d: '結果是醫師、她和女兒三個人一起聽的。之後的每一次回診，女兒都陪著。',
    ...AFTER_MORE,   // 第四章以後的，寫在每個主訴自己的文獻檔裡
  };
  const patients: Entry[] = CASES.map((c) => {
    const rec = save.cases[c.id], truth = c.forms.find((f) => f.id === c.answer.truth)!;
    return {
      id: c.id, name: c.patient.name, tag: c.patient.age + ' 歲，' + c.patient.job,
      lines: [rec?.found ? '診斷：' + truth.name + '。' : '還沒有診斷對過。', ...(after[c.id] ? [after[c.id]] : [])],
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
    { id: 'tower', name: '燈塔的值夜房', tag: '還沒去過', lines: [], shot: { kind: 'hall' }, open: false, hint: chapterDone(5, save) ? '終章：大霧值班夜' : '之後的章節' },
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
