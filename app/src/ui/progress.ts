// 長期的推進：委託怎麼解鎖、故事什麼時候往下走、圖鑑怎麼被寫回來、階級怎麼升。
// 全部從「玩過哪些病例、解讀對哪些線索」算出來，沒有另外的經驗值。
import { eldersMet, elderChapter } from '../core/elders.ts';
import { ELDERS, ISLANDS, ISLAND_OF, RESIDENTS, type IslandId } from '../data/islands.ts';
import type { CaseDef, Score, Session } from '../core/types.ts';
import type { ComplaintDef } from '../core/module.ts';
import { harvest } from '../core/scoring.ts';
import { perilOf } from '../core/perils.ts';
import { CANTOS, PERILS, type Peril } from '../data/odyssey.ts';
import { TIDE_DONE } from '../data/tides.ts';
import { CASES, COMPLAINTS, FINALE_ID, caseById } from '../data/index.ts';
import { PLACES } from '../data/places.ts';
import { AFTER_MORE } from '../data/extras.ts';
import type { Line } from './Talk.tsx';
import type { CaseRecord, Save, TrialRecord } from './store.ts';
import { addDay, dayKey } from './streak.ts';
import type { Shot } from './Portrait.tsx';

/** 委託板上的一張委託。needs：要先完成哪一張才會出現 */
export interface Quest { caseId: string; chapter: number; needs?: string | string[] }
export const QUESTS: Quest[] = [{ caseId: 'c01a', chapter: 1 }, { caseId: 'c01b', chapter: 1, needs: 'c01a' }, { caseId: 'c01c', chapter: 1, needs: 'c01b' }, { caseId: 'c01d', chapter: 1, needs: 'c01c' },
  // 第二章：第一章走完才會貼上板子。兩隻劫影可以交錯著接
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
// 上面一層是每一章要練的事：一隻劫影不只一個答案、聽出不一樣的地方、太早寫下的結論、撐著的人、說不出口的事。
// 底下一層是一條線：圖鑑最前面被拆走的那一頁。十五年前的冬天霧四十天沒有散，歐律克勒亞寫了「一隻劫影一行字」的索引，
// 見習的孟拓照著它讓一個人回去，馬凱簽了名，費民把後來那一頁勘誤拆下來藏了十五年。沒有壞人；每個人都只省了一步。
// {you}、{greet}、{habit}、{own} 在大廳換成玩家選的那一位（toYou）。
export const BEATS: Beat[] = [
  // 序章要交代四件事：這是哪裡、你是誰、出了什麼事、你要做什麼
  { id: 'prologue', title: '序章　遺失的一頁', when: () => true, lines: [
    { who: 'sys', text: '「說吧，記事的人，說那位見習的故事：在霧海上漂流，見過許多人的病，認出許多藏在霧裡的形狀。」' },
    { who: 'sys', text: '霧港，在伊塔洛斯島上，是霧海群島的主港。本島之外，還有十一座搭巡診船就到得了的外島：每一座島上，都有一種劫影在等。一年裡有大半的日子起霧。' },
    { who: 'sys', text: '霧裡住著一位海中老人。人在痛、在喘、說不清自己怎麼了的時候，他會化成一種形狀，浮在那個人身邊。港城的人叫這些形狀「劫影」：每一種，都是一段海上的試煉。' },
    { who: 'sys', text: '劫影誰都看得見，所以身邊一浮出來，人就知道該來公會了。可是它只描得出「哪裡不舒服」，描不出「為什麼」。要抓著它不放，一直問、一直看，它才會現出原形。' },
    { who: 'sys', text: '霧港的公會，是港城的人不舒服的時候會來的地方。你，{you}，是剛結束訓練的見習專科護理師，今天第一天來報到。' },
    { who: 'mentor', text: '{you}？我是孟拓，這裡的資深專科護理師，值班十幾年了。接下來由我帶你。{greet}' },
    { who: 'mentor', text: '櫃台後面寫字的是費民，管檔案室和圖鑑。值班的醫師叫馬凱：病人你先看，看完向他回報；檢查和用藥由他決定。病人等不了的時候敲值班鐘，他會馬上來。' },
    { who: 'mo', text: '……抱歉，沒辦法好好招呼你。檔案室昨晚淹水了。檔案室在法羅斯，本島東邊那座低低的小島。開架上的圖鑑只救回劫影的外形，底下寫的字都糊掉了。' },
    { who: 'mo', text: '大潮常淹到門口。淹進櫃子裡的那種潮，上一次是十五年前。' },
    { who: 'sys', text: '孟拓抬頭看了窗外一眼，沒有說話。' },
    { who: 'mo', text: '還有一件事。清點的時候才發現，最前面少了一頁。不是泡爛的；裝訂的線頭是舊的，很久以前就被人拆走了。' },
    { who: 'mentor', text: '……那一頁以後再說。先顧眼前的。' },
    { who: 'mentor', text: '圖鑑是前人一筆一筆記下來的：每一種劫影，背後可能是哪幾種病，該問什麼，什麼時候不能等。現在只剩圖。從今天起，每一位進來的人都要重新看，一頁一頁寫回來。' },
    { who: 'mentor', text: '記住一件事：劫影只告訴你「哪裡不舒服」，不告訴你「為什麼」。同一隻劫影，背後可能是四種完全不同的病。' },
    { who: 'mentor', text: '來看病的人，公會記成一張一張的「委託」：一張委託，就是一位病人。' },
    { who: 'mentor', text: '每一張你要做的事，和受訓的時候學的一樣：問診、身體評估、說出最可能的診斷和還要排除的診斷、提出檢查、向醫師回報、跟病人說明。我在旁邊；卡住了就問我。' },
    { who: 'mentor', text: '板子上那張蓋了紅蠟的，是剛送來的。去看看吧。' },
    { who: 'sys', text: '開頭那一句，是費民唸的。公會的老規矩：圖鑑每翻開新的一篇，記事的人先唸一段開場。' },
  ] },
  { id: 'ch1-second', title: '第一章　鐘聲之前', when: (s) => !!s.cases.c01a, lines: [
    { who: 'mo', text: '獨眼蛾那一頁回來了一半。舊索引上只寫了一行：「獨眼蛾，心」。字很急，墨還沒乾就翻頁了。' },
    { who: 'mentor', text: '一隻劫影只配一個答案。那本索引就是這樣害人的。' },
    { who: 'mentor', text: '碼頭又送來一位，同事說「跟林秋那天一樣」。你去看看，是不是真的一樣。' },
  ] },
  { id: 'ch1-third', title: '第一章　同一張面孔', when: (s) => has(s, ['c01a', 'c01b']), lines: [
    { who: 'mo', text: '兩個人，同一隻蛾，兩個診斷。舊索引那一行，我劃掉了。' },
    { who: 'mentor', text: '還沒完。同一隻蛾，還會停在別的人身上。' },
    { who: 'mentor', text: '有位老船工，胸口悶了一個多月。他說不急。你去看看。' },
  ] },
  { id: 'ch1-fourth', title: '第一章　慢慢來的那一隻', when: (s) => has(s, ['c01a', 'c01b', 'c01c']), lines: [
    { who: 'mo', text: '獨眼蛾這一頁，寫回來三位了。' },
    { who: 'mentor', text: '每一位，四個診斷你都要有憑據：最可能的是哪一個，其他的憑什麼排除。下一位也一樣。' },
    { who: 'sys', text: '碼頭那邊有人跑進來：一艘貨船剛靠岸，有個人下跳板的時候喘不過氣，走不到公會。' },
    { who: 'mentor', text: '這一張是出診。把包背上，鐘我來拿。' },
  ] },
  { id: 'ch1-complete', title: '第一章　完', when: (s) => chapterDone(1, s), lines: [
    { who: 'mo', text: '四盞燈，四個人。獨眼蛾這一頁寫回來了。' },
    { who: 'mentor', text: '同一句「胸口痛」，一個要馬上叫人，一個可以回家，一個不能放走，一個差點被當成緊張。' },
    { who: 'mo', text: '劃掉舊的那一行的時候，我才看清楚：這本索引有兩種筆跡。一種很穩，一種很年輕。' },
    { who: 'sys', text: '孟拓沒有接話。她走到窗邊，看了一會兒燈塔。', fx: 'window' },
    { who: 'mentor', text: '第一章到這裡。下一頁是別的劫影，還在整理，好了會貼到委託板上。', fx: 'window' },
    { who: 'sys', text: '大廳的門開了。一位頭髮全白的老人走進來，孟拓站了起來。' },
    { who: 'guest', name: '埃普', text: '我是埃普，公會的會首。外島分成四片海，每一片最大的那座島有一位老醫生顧著分站；我們五個，就是五島長老會。' },
    { who: 'guest', name: '埃普', text: '外島的人不肯爬坡，也不肯搭船來看病。巡診船明天出海，你跟著去。' },
    { who: 'sys', text: '你升為「巡診專科護理師」。' },
  ] },
  { id: 'ch2-open', title: '第二章　斯克里亞・一樣的兩句話', when: (s) => chapterDone(1, s), lines: [
    { who: 'mo', text: '（照老規矩，先唸開場）「' + bardOf('tide') + '」' },
    { who: 'mo', text: '下一頁有兩隻。一隻肚子像風箱，一鼓一縮；一隻把繩子打成結，抱在懷裡不放。' },
    { who: 'mentor', text: '風袋蛙是喘，斯庫拉蟹是腹痛。這兩隻最會騙人：來的人講的話都差不多，底下卻完全不一樣。' },
    { who: 'mentor', text: '流程你已經熟了。這一章要練的是聽：同樣一句「我很喘」「我肚子痛」，要問到它們不一樣的地方。' },
    { who: 'mentor', text: '這一章不在本島看。斯克里亞的魚市天沒亮就開，喘了、痛了，也不肯搭船過來。公會在魚市口有一間診間，我們搭巡診船過去。' },
    { who: 'sys', text: '斯克里亞的碼頭上，一位老醫生拿著一本潮汐表在等。' },
    { who: 'guest', name: '諾可', text: '我是諾可。這間分站的紀錄表，一格一格都是我畫的。數字不會騙人。' },
    { who: 'mentor', text: '從這一章起，卡住的時候，除了問我，也可以請教老醫生：會首埃普，和你去過的島上的那一位。要打燈號請他們過來，會花時間。' },
    { who: 'mentor', text: '他們每一位都很會問，也都有不問的地方。他們沒提的，不代表你做完了。' },
    { who: 'sys', text: '委託板上多了兩張新的。一張在斯克里亞的魚市口；一張在更北邊的埃俄利亞，整座島都在縫帆。' },
  ] },
  { id: 'ch2-half', title: '第二章　三行', when: (s) => has(s, ['c02a', 'c02b', 'c03a', 'c03b']), lines: [
    { who: 'mo', text: '兩頁各寫回了一半。風袋蛙還有「肺部感染」和「突發急症」，斯庫拉蟹還有「胰臟與胃」和「大腸憩室」，底下都還沒有人名。' },
    { who: 'mentor', text: '一個是水，一個是氣；一個吃完油的才痛，一個從肚臍開始痛。這些差別，都是你自己問出來的。' },
    { who: 'sys', text: '你瞄到孟拓的紀錄板。每一位病人，她只寫三行。' },
    { who: 'mentor', text: '第一行，他說的。第二行，我看到的。第三行，還不知道的。' },
    { who: 'mentor', text: '第三行不能空著。空著，就是你以為自己都知道了。' },
    { who: 'mentor', text: '剩下的四張委託已經送到了。' },
  ] },
  { id: 'ch2-complete', title: '第二章　完', when: (s) => has(s, CH2), lines: [
    { who: 'mo', text: '風袋蛙四盞，斯庫拉蟹四盞，都有人名了。圖鑑寫回了三頁。' },
    { who: 'mentor', text: '八個人，講的幾乎是同樣兩句話：「我很喘」「我肚子痛」。你問到了他們不一樣的地方。' },
    { who: 'mentor', text: '還有一件事：最後那一位怕的不是痛。她怕什麼，不問是聽不到的。' },
    { who: 'guest', name: '諾可', text: '這八個人，數字有一半是正常的。你是問出來的，不是量出來的。' },
    { who: 'guest', name: '諾可', text: '……我的表上，從來沒有「他在擔心什麼」這一格。' },
    { who: 'mentor', text: '第二章到這裡。' },
  ] },
  { id: 'rank-duty', title: '升階　值班專科護理師', when: (s) => tierOf(s) === 1, lines: [
    { who: 'mentor', text: '從今天起，你是值班專科護理師。披肩不換，換的是我幫你的方式。' },
    { who: 'mentor', text: '以前我會先告訴你，一條線索是讓某個診斷更像，還是比較不像。現在這一步你自己來。' },
    { who: 'mentor', text: '還有，一張委託我只回答你三次。想清楚再問。' },
    { who: 'mentor', text: '{habit}' },
    { who: 'mo', text: '舊的委託也可以重接。同一位病人，少了提示，你看到的東西會不一樣。' },
  ] },
  { id: 'ch3-open', title: '第三章　法羅斯・被蓋掉的紀錄', when: (s) => tierOf(s) === 1, lines: [
    { who: 'mo', text: '（照老規矩，先唸開場）「' + bardOf('book') + '」' },
    { who: 'mo', text: '我在法羅斯淹過水的櫃子最底下，找到一個鉛盒。外面裹著油布，一滴水都沒進。' },
    { who: 'mo', text: '裡面是一疊舊索引。每一張上面只有一行字：「著涼」「年紀大了」「老毛病」。然後就歸檔了。' },
    { who: 'mo', text: '這一疊對到兩隻劫影。一隻背上的炭一明一滅，是發燒；一隻停在人頭上一下一下地啄，是頭痛。' },
    { who: 'mo', text: '最底下還壓著一張，不是索引。是一張名單：十一個名字。抬頭被水泡掉了，只剩半個字。', fx: 'page' },
    { who: 'mentor', text: '……那一張先收著。', fx: 'page' },
    { who: 'mentor', text: '太早寫下的結論，會把後面的線索都蓋掉。這一章，你把這幾張重新打開。' },
    { who: 'mentor', text: '不過記住：舊索引不一定都寫錯。對的，你要替它找到憑據；錯的，你要說得出錯在哪裡。' },
    { who: 'mo', text: '這一疊要一張一張對，離不開檔案室。隔壁那間舊病室，是公會最早的一間診間，我清出來了。繩子上晾的是還沒乾的索引，別碰掉。' },
    { who: 'sys', text: '法羅斯的老醫生在舊病室門口等你們。' },
    { who: 'guest', name: '聶思', text: '聶思。這幾張索引上的人，我都記得。哪一年、什麼天氣，我都記得。' },
    { who: 'sys', text: '委託板上多了兩張新的。一張在法羅斯，檔案室旁的舊病室；一張在北邊放牛的特里納基亞。' },
  ] },
  { id: 'ch3-half', title: '第三章　落款', when: (s) => has(s, CH3_HALF), lines: [
    { who: 'mo', text: '四張舊索引，三張劃掉重寫，一張底下補了憑據。' },
    { who: 'mentor', text: '兩張「老毛病」，一張是對的，一張差一點出事。差別不在那三個字，在寫的人有沒有查過。' },
    { who: 'mentor', text: '剩下的四張，費民剛從櫃子底下翻出來。' },
    { who: 'mo', text: '這四張寫的是：「感冒，還沒好」「感染沒清乾淨」「宿醉」「更年期」。有一張，底下還多補了一行。' },
    { who: 'mo', text: '補的那一行是：「錯了。重看。」落款只有一個字：歐。' },
    { who: 'mentor', text: '歐律克勒亞。我的老師。這本索引，是她寫的。' },
  ] },
  { id: 'ch3-complete', title: '第三章　完', when: (s) => has(s, CH3), lines: [
    { who: 'mo', text: '八張舊索引都重新打開了。七張劃掉重寫，一張底下補了憑據。' },
    { who: 'mentor', text: '這些字不是亂寫的。「感冒」「宿醉」「更年期」，十次裡有九次是對的。危險的是第十次，還有寫完就不再看的那個習慣。' },
    { who: 'mentor', text: '有一張的答案是「不是感染」，有一張是「真的只是老毛病」。把東西排除掉，跟把東西找出來，一樣是本事。' },
    { who: 'mo', text: '……那張名單，我把抬頭拼回來了。兩個字：「勘誤」。', fx: 'page' },
    { who: 'mo', text: '你報到那天，我說最前面那一頁「被人拆走了」。那個人是我。十五年前，長老會說圖鑑不能有勘誤，要我拆下來燒掉。我拆了，沒有燒。用油布包好，鎖進鉛盒，塞在最底下。', fx: 'page dusk' },
    { who: 'guest', name: '聶思', text: '那一次是五島長老會表決，三比二。我和歐吉吉亞的雅蕾投「訂上去」。會首、斯克里亞的諾可、拉莫斯的狄墨投「不訂」。', fx: 'page dusk' },
    { who: 'guest', name: '聶思', text: '他們不是壞人。那個冬天，大家都怕。', fx: 'dusk' },
    { who: 'mentor', text: '第三章到這裡。' },
  ] },
  { id: 'ch4-open', title: '第四章　拉莫斯・撐著走來的人', when: (s) => chapterDone(3, s), lines: [
    { who: 'mo', text: '（照老規矩，先唸開場）「' + bardOf('keel') + '」' },
    { who: 'mo', text: '這一頁開始，圖鑑上多了三隻：背上馱著石頭的龜、只用一隻腳站的鷺、一碰就鼓起來的豚。背痛、腳痛、腫。' },
    { who: 'mentor', text: '這一章來的人，都是撐著、拖著才來的。能撐，不代表不要緊。' },
    { who: 'mentor', text: '一樣是痛、一樣是腫，你要分出哪一個不能等。方法很土：把兩邊比一比，把該脫的鞋襪脫掉看。' },
    { who: 'mentor', text: '拉莫斯的船塢在趕一艘船，沒有人肯放下手上的活走過來。公會跟船塢借了一間工寮，這一章我們過去看。' },
    { who: 'sys', text: '拉莫斯的碼頭上，一個站著不坐的人迎上來。' },
    { who: 'guest', name: '狄墨', text: '狄墨。船塢一出事，我先到。先看他等不等得了，其他的等一下。' },
    { who: 'sys', text: '委託板上多了三張新的。拉莫斯的船塢一張；東邊有山的帕納索一張；西邊漩渦旁的卡律布狄斯一張。' },
  ] },
  { id: 'ch4-half', title: '第四章　四十天', when: (s) => has(s, CH4_HALF), lines: [
    { who: 'sys', text: '值班鐘沒有響，馬凱卻自己走進了大廳。他看了一眼櫃台上那張名單。', fx: 'shen' },
    { who: 'doctor', text: '十五年前的冬天，先是一場大潮把法羅斯淹了。然後霧四十天沒有散。船出不去，人一直進來。值班的只有三個：歐律克勒亞、我，還有一個見習。', fx: 'shen dusk' },
    { who: 'doctor', text: '歐律克勒亞寫了那本索引。一隻劫影一行字，讓誰來都能先分出輕重。那個冬天，它救了很多人。', fx: 'shen dusk' },
    { who: 'doctor', text: '我負責簽名。四十天，我簽了幾百張，沒有一張是看過才簽的。', fx: 'shen dusk' },
    { who: 'doctor', text: '所以我現在只問一句：「告訴我重點。」問了，我就得聽完。', fx: 'shen' },
    { who: 'sys', text: '他沒有說那個見習是誰。', fx: 'shen' },
  ] },
  { id: 'ch4-complete', title: '第四章　完', when: (s) => chapterDone(4, s), lines: [
    { who: 'mo', text: '三隻劫影，十二盞燈，都有人名了。' },
    { who: 'mentor', text: '他們進門的時候，幾乎都說「還撐得住」。裡面有幾位，是用鐘頭在算的。' },
    { who: 'mentor', text: '十五年前，也有一個人這樣說。守燈塔的埃爾佩諾。第三十一天，他自己從塔上走下來的。', fx: 'dusk' },
    { who: 'mentor', text: '我那時候是見習。我看了索引，寫了一行字，讓他回去。', fx: 'dusk' },
    { who: 'mentor', text: '那天晚上，燈塔沒有亮。', fx: 'dusk dark' },
    { who: 'mentor', text: '勘誤上的第十一個名字是他。那一行字，是我的筆跡。', fx: 'dusk dark page' },
    { who: 'you', text: '{own}', fx: 'dusk' },
    { who: 'mentor', text: '這一句「還撐得住」，你以後聽到，要多看一眼：看另一邊、看襪子底下、看他是怎麼走進來的。' },
    { who: 'guest', name: '狄墨', text: '我那一票投「不訂」。大霧裡，見習要的是一個馬上能照做的答案。勘誤會讓人猶豫；猶豫，也會死人。', fx: 'dusk' },
    { who: 'guest', name: '狄墨', text: '……可是這一章的人，你如果照一行字放回去，有幾個撐不到天亮。下一次表決，我改。' },
    { who: 'mentor', text: '第四章到這裡。' },
  ] },
  { id: 'ch5-open', title: '第五章　歐吉吉亞・說不出口的事', when: (s) => chapterDone(4, s), lines: [
    { who: 'mo', text: '（照老規矩，先唸開場）「' + bardOf('bamboo') + '」' },
    { who: 'mo', text: '最後這四頁，我一直壓在最底下：排泄物、疹子、瘦了、麻了。來的人自己都講不清楚。' },
    { who: 'mentor', text: '有些是不好意思說，有些是不知道怎麼說。要問，他才會說；怎麼問，決定他說不說。' },
    { who: 'mentor', text: '簾子拉好，話說慢一點。該看的地方要看；看之前，先讓他知道為什麼。' },
    { who: 'mentor', text: '這一章的話，在人來人往的地方問不出來。歐吉吉亞的坡頂有一間靜室，門關得起來，屏風拉得上。我們到那裡看。' },
    { who: 'sys', text: '爬到半坡，一位老太太坐在竹籬邊縫衣服，等你們。' },
    { who: 'guest', name: '雅蕾', text: '我是雅蕾。讓他說完，你再說。' },
    { who: 'mentor', text: '說不出口的，不只是病人。那張勘誤，我們三個人十五年沒有提過一個字。' },
    { who: 'sys', text: '委託板上多了四張新的，四座島各一張：歐吉吉亞的坡頂、北邊果園的洛托法吉、東邊林子裡的埃埃亞，和最西邊終年起霧的辛梅里亞。' },
  ] },
  { id: 'ch5-half', title: '第五章　第十二行', when: (s) => has(s, CH5_HALF), lines: [
    { who: 'mo', text: '勘誤我重新抄了一份。原來那張有十二行：十一個名字，第十二行是空的。', fx: 'page page12' },
    { who: 'mo', text: '空行旁邊有一行小字，是歐律克勒亞的筆跡：「留給下一個寫這本圖鑑的人。」', fx: 'page page12' },
    { who: 'mentor', text: '冬天過完，她要把這一頁訂在索引的最前面。公會不肯。她把值班鐘交回來，上了燈塔。埃爾佩諾走了，燈總要有人顧。', fx: 'dusk' },
    { who: 'mentor', text: '十五年，那盞燈沒有熄過。她也沒有下來過。', fx: 'window' },
    { who: 'mentor', text: '她留的不是一個位置，是一條規矩：錯了，寫上去，放在第一頁。' },
    { who: 'guest', name: '雅蕾', text: '十五年前我投「訂上去」。錯了，要讓人說得出口。病人是這樣，寫圖鑑的人也是。' },
  ] },
  { id: 'ch5-complete', title: '第五章　完', when: (s) => chapterDone(5, s), lines: [
    { who: 'mo', text: '十二隻劫影，四十八盞燈。舊索引上的一行字，一行一行都改寫完了。' },
    { who: 'mentor', text: '你現在看到一隻劫影，想到的不是一個答案，是四個方向，還有哪一個不能漏。' },
    { who: 'mentor', text: '圖鑑寫完了，可是來的人不會照著圖鑑生病，也不會一個一個來。' },
    { who: 'mo', text: '還有一件事。那一頁要不要訂在第一頁，不是我說了算。' },
  ] },
  { id: 'council', title: '五島長老會', when: (s) => chapterDone(5, s), lines: [
    { who: 'sys', text: '新的圖鑑裝訂好的那天，外島的老醫生都搭巡診船來了。五島長老會，在大廳開會。' },
    { who: 'guest', name: '埃普', text: '十五年前那一頁，要不要訂在圖鑑的第一頁，今天重新表決。' },
    { who: 'guest', name: '聶思', text: '訂上去。' },
    { who: 'guest', name: '雅蕾', text: '訂上去。' },
    { who: 'guest', name: '諾可', text: '十五年前我算的是：十一個，對上那個冬天救回來的四百多個。這一次，我把他們在擔心什麼也算進去了。訂上去。' },
    { who: 'guest', name: '狄墨', text: '訂上去。' },
    { who: 'sys', text: '大廳安靜了很久。埃普把手按在那一頁上。', fx: 'page' },
    { who: 'guest', name: '埃普', text: '我十五年前說，圖鑑有勘誤，就沒有人敢來。這十五年，來的人沒有少。少的，是肯說「我錯了」的人。', fx: 'page' },
    { who: 'guest', name: '埃普', text: '訂上去。五票。', fx: 'page' },
    { who: 'mo', text: '新的圖鑑，我把勘誤訂回第一頁了。十一個名字都在。第十二行，還是空的。', fx: 'page page12' },
    { who: 'mentor', text: '希望你永遠用不到那一行。可是如果有那一天：寫上去，不要拆。', fx: 'page page12' },
    { who: 'sys', text: '費民抄了一份新圖鑑的目錄，託送燈油的人帶上燈塔。三天後，回信只有一行。' },
    { who: 'sys', text: '「第三行，還寫嗎？」', fx: 'window' },
    { who: 'sys', text: '孟拓看了很久。然後她拿起紀錄板，寫下今天的第三行。', fx: 'window' },
  ] },
  { id: 'axes-all', title: '終篇　英雄歸來', when: (s) => finaleDone(s) && axesLit(s).length === 12, lines: [
    { who: 'sys', text: '第十二把斧頭亮起來的那天，大廳裡沒有人說話。' },
    { who: 'mo', text: '「說吧，記事的人，說那張弓：沒有人拉得開，箭要穿過排成一列的十二把斧頭。」……這一篇，我等了很久才唸得出口。', fx: 'page' },
    { who: 'mentor', text: '十二種劫影，你都在沒有人幫忙、時間照真的走的時候，走過一次了。' },
    { who: 'mentor', text: '史詩裡，主人拉開那張弓，大家才認出他。可是他不是那一刻才變成那個人的：是一路上，一關一關認出來的。' },
    { who: 'guest', name: '埃普', text: '長老會不再替你另外表決了。往後你看的人，就是你的表決。' },
    { who: 'sys', text: '孟拓把她的紀錄板交到你手上。板子上夾著一張新的紙，三行都還空著。', fx: 'window' },
    { who: 'mentor', text: '碼頭上有一位新來的見習在等船。{you}，這一次，換你帶。', fx: 'window' },
    { who: 'sys', text: '霧港又起霧了。歸航燈的光，一圈一圈掃過去。', fx: 'window' },
  ] },
  // 終章分三段：燈熄了（開場）→ 值班夜的三輪分流（Night.tsx）→ 上燈塔看歐律克勒亞（病例 C01E）→ 結尾
  { id: 'finale-open', title: '終章　歸航・大霧值班夜', when: (s) => finaleOpen(s), lines: [
    { who: 'mo', text: '（照老規矩，先唸開場）「' + bardOf('home') + '」' },
    { who: 'sys', text: '回信送到的第三天。傍晚，霧比平常來得早。', fx: 'dusk' },
    { who: 'sys', text: '法羅斯傳來燈號：大潮又漫上來了。跟十五年前一樣。', fx: 'dusk' },
    { who: 'sys', text: '費民去關窗。他的手停在窗框上。', fx: 'dusk' },
    { who: 'mo', text: '……燈塔的燈，沒有亮。', fx: 'dusk dark' },
    { who: 'sys', text: '十五年沒有熄過的那一盞燈，熄了。', fx: 'dusk dark' },
    { who: 'sys', text: '孟拓走到窗邊。她的手按在窗台上，很久沒有說話。', fx: 'dusk dark window' },
    { who: 'mentor', text: '……先顧眼前的。燈不亮，船看不到礁石。今晚進來的人，不會一個一個來。', fx: 'dusk dark window' },
    { who: 'sys', text: '值班鐘沒有響，馬凱已經走進了大廳。', fx: 'dusk dark shen' },
    { who: 'doctor', text: '今晚我就在這裡。敲鐘不是找我；敲鐘，是告訴我先看誰。', fx: 'dusk dark fog shen' },
    { who: 'mentor', text: '{you}，今晚你站門口。門口同時有兩個人的時候，先看誰、另一個交給誰、什麼時候回頭，你決定。', fx: 'dusk dark fog shen' },
    { who: 'mentor', text: '塔上的事，等這裡的人都安頓了再說。這是她教我的。', fx: 'dusk dark fog' },
    { who: 'sys', text: '委託板的最底下，多了一張沒有封蠟的：值班夜。', fx: 'dark fog' },
  ] },
  { id: 'finale-tower', title: '終章　還撐得住', when: (s) => nightDone(s), lines: [
    { who: 'sys', text: '後半夜，門口終於空了。滿姨睡著了，秦伯醒了，賴叔被抬上了後送的車。', fx: 'dusk dark fog' },
    { who: 'sys', text: '門又響了一聲。是送燈油的人，剛從塔上下來。', fx: 'dusk dark fog' },
    { who: 'sys', text: '「燈是傍晚熄的。歐律克勒亞婆婆坐在值夜房裡，不讓我扶。她要我帶一句話下來。」', fx: 'dusk dark fog' },
    { who: 'sys', text: '「胃不太舒服，還撐得住。塔上不用上來人。」', fx: 'dusk dark fog' },
    { who: 'sys', text: '孟拓手上的紀錄板掉在地上。', fx: 'dusk dark fog' },
    { who: 'mentor', text: '……十五年前，埃爾佩諾說的也是這一句。', fx: 'dusk dark fog' },
    { who: 'mentor', text: '那一次，我看了索引，寫了一行字。這一次我不寫。', fx: 'dusk dark fog' },
    { who: 'mentor', text: '{you}，你去看她。我跟著，鐘我來拿。我只寫我的三行。', fx: 'dusk dark fog' },
    { who: 'doctor', text: '這幾床我顧。鐘一響，我就上去。那一百多階，這一次我會爬完。', fx: 'dusk dark fog shen' },
    { who: 'sys', text: '委託板上貼了最後一張。地點寫的是：燈塔。', fx: 'dark fog' },
  ] },
  { id: 'finale-complete', title: '終章　完', when: (s) => finaleDone(s), lines: [
    { who: 'sys', text: '天快亮的時候，歐律克勒亞被抬下了塔。馬凱走在擔架旁邊，手一直沒有離開她的脈搏。', fx: 'dusk dark' },
    { who: 'sys', text: '塔上只剩孟拓。她提起油壺，爬完剩下的那一段樓梯，把燈點上了。', fx: 'dusk' },
    { who: 'sys', text: '光掃過港口。停在外海的船，一艘一艘開始動。', fx: 'window' },
    { who: 'mo', text: '她在後送的車上要了紙筆，寫了三行，要我交給你。' },
    { who: 'sys', text: '第一行：「我說的是胃。」' },
    { who: 'sys', text: '第二行：「她看到的是：出力就悶，歇了不退，一身冷汗。」' },
    { who: 'sys', text: '第三行：「還不知道的，她沒有替我填滿。她敲了鐘。」' },
    { who: 'mentor', text: '舊索引上，獨眼蛾那一行寫的是「心」。昨晚的答案，也是心。', fx: 'window' },
    { who: 'mentor', text: '那一行字從來沒有寫錯。錯的是看到它，就不再問了。昨晚，你是一題一題問出來的。', fx: 'window' },
    { who: 'mo', text: '勘誤的第十二行，還是空的。', fx: 'page page12' },
    { who: 'mentor', text: '讓它空著。它在第一頁，是告訴下一個人：這本圖鑑會錯，寫它的人也會。', fx: 'page page12' },
    { who: 'mentor', text: '{you}。以後新來的人，由你帶。第一件事，教他們寫三行。' },
    { who: 'sys', text: '霧港又起霧了。燈塔的光，一圈一圈掃過去。', fx: 'window' },
    { who: 'sys', text: '所有的委託都走完了。圖鑑還可以繼續寫；想知道自己準備好了沒有，委託板上有試弓。' },
    { who: 'sys', text: '大廳的牆上掛起了一排十二把斧頭，一種劫影一把。在一種劫影的試弓裡及格一次，那一把就會亮。' },
  ] },
];

// ── 終章 ──
/** 值班夜（三輪分流）走完了：和看過的故事記在同一個地方，所以會跟著存檔、匯出和同步 */
export const NIGHT_DONE = 'night-done';
/** 第五章走完，終章才開始 */
export const finaleOpen = (s: Save) => chapterDone(5, s);
export const nightDone = (s: Save) => finaleOpen(s) && s.beats.includes(NIGHT_DONE);
/** 燈塔那一張委託：值班夜走完、而且聽完送燈油的人帶來的話，才會貼上板子 */
export const towerOpen = (s: Save) => nightDone(s) && s.beats.includes('finale-tower');
export const finaleDone = (s: Save) => !!s.cases[FINALE_ID];

/** 舊檔案：歐律克勒亞在四十天霧那個冬天寫的值班日誌。想知道更多的人可以在圖鑑裡慢慢讀；不讀也不影響玩 */
export interface Leaf { id: string; day: string; hint: string; when(s: Save): boolean; lines: string[] }
export const ARCHIVE: Leaf[] = [
  { id: 'log-03', day: '第三天', hint: '第一章走完之後', when: (s) => chapterDone(1, s), lines: ['霧沒有散。出海的船都叫回來了。', '病室六張床，躺了十一個人。值班的三個：我、馬凱、新來的見習。見習的手很快，字很好看。'] },
  { id: 'log-09', day: '第九天', hint: '第二章走完之後', when: (s) => has(s, CH2), lines: ['人太多，來不及一個一個教。我寫了一本索引給見習用：一隻劫影，一行字，先分出誰不能等。', '馬凱說這樣太粗。我說，粗的網也比沒有網好。'] },
  { id: 'log-17', day: '第十七天', hint: '第三章走到一半之後', when: (s) => has(s, CH3_HALF), lines: ['索引好用。今天進來六十一個人，急的一個都沒有漏。', '見習不再跑來問我了。她看索引。我本來應該覺得輕鬆。'] },
  { id: 'log-31', day: '第三十一天', hint: '第四章走到一半之後', when: (s) => has(s, CH4_HALF), lines: ['守燈塔的埃爾佩諾自己從塔上走下來。他說不太舒服，還撐得住；塔上沒有人不行。', '見習看了索引，寫了一行，讓他回去。我在隔壁縫一個傷口，沒有過去看。'] },
  { id: 'log-32', day: '第三十二天', hint: '第四章走完之後', when: (s) => chapterDone(4, s), lines: ['昨天夜裡，燈塔沒有亮。', '早上去的人說，燈油是滿的。'] },
  { id: 'log-40', day: '第四十天', hint: '第五章走到一半之後', when: (s) => has(s, CH5_HALF), lines: ['霧散了。我把四十天的紀錄從頭看了一遍。索引寫錯的，十一個。', '十一個名字，我抄成一頁，要訂在最前面。見習的那一行我沒有劃掉。那不是她一個人寫的：索引是我的，簽名是馬凱的。'] },
  { id: 'log-after', day: '之後', hint: '第五章走完之後', when: (s) => chapterDone(5, s), lines: ['長老會表決，三比二：圖鑑不能有勘誤，不然沒有人敢來。', '索引不是錯在快。錯在它讓人不再問。', '鐘我交回去了。埃爾佩諾的燈，我去顧。第十二行留著。'] },
];
export const nextBeat = (s: Save) => BEATS.find((b) => !s.beats.includes(b.id) && b.when(s));

export const chapterDone = (n: number, s: Save) => QUESTS.filter((q) => q.chapter === n).every((q) => s.cases[q.caseId]);
/** 階級只代表提示少了幾層，不加任何數值。第一章走完是巡診，第二章走完是值班 */
/**
 * 委託在板子上叫什麼。標題常常就是那一位病人的關鍵線索（「躺不平的夜」「從肚臍開始的」），
 * 先看到等於先知道方向；所以結案之前只寫病人的名字，結案之後才換成標題。
 */
export const questName = (c: { title: string; patient: { name: string } }, done: boolean) => (done ? c.title : c.patient.name);
export const rankOf = (s: Save) => (!chapterDone(1, s) ? '見習專科護理師' : !chapterDone(2, s) ? '巡診專科護理師' : '值班專科護理師');
/** 提示拿掉了幾層：升到值班之後拿掉第一層 */
export const tierOf = (s: Save): 0 | 1 => (chapterDone(1, s) && chapterDone(2, s) ? 1 : 0);

/** 把一場對局的結果併進存檔 */
/** 結束一場：打卡（今天），留一筆紀錄。委託和試弓都算 */
export const PLAYS_KEPT = 300, TRAPS_SHOWN = 100;
function checkIn(save: Save, c: CaseDef, session: Session, at: number, score: Score, trial: boolean, takeaway: string | null): Pick<Save, 'days' | 'plays'> {
  const p = perilOf(c, session), play = { at, caseId: c.id, score: Math.round(score.total), trial, found: harvest(c, session).found, trapped: p ? p.trapped : null, takeaway };
  return { days: addDay(save.days, dayKey(at)), plays: [play, ...(save.plays ?? [])].slice(0, PLAYS_KEPT) };
}

export function record(save: Save, c: CaseDef, session: Session, score: Score, seconds: number, takeaway: string | null, at = Date.now()): Save {
  const old = save.cases[c.id], h = harvest(c, session), total = Math.round(score.total), better = !old || total > old.best;
  const reads = [...(old?.reads ?? [])];
  h.reads.forEach((r) => { if (!reads.some((k) => k.clue === r.clue)) reads.push(r); });
  const rec: CaseRecord = { best: better ? total : old.best, safety: better ? score.safety : old.safety, plays: (old?.plays ?? 0) + 1, seconds, found: !!old?.found || h.found, concern: !!old?.concern || h.concern, reads };
  const takeaways = takeaway ? [takeaway, ...save.takeaways.filter((t) => t !== takeaway)].slice(0, 5) : save.takeaways;
  const passed = perilOf(c, session)?.trapped === false && !save.beats.includes(PASSED(c.id));
  return { ...save, ...checkIn(save, c, session, at, score, false, takeaway), cases: { ...save.cases, [c.id]: rec }, takeaways, beats: passed ? [...save.beats, PASSED(c.id)] : save.beats };
}

// ── 試弓 ──
// 照甄審口試的條件走一次：用抽的、站內 15 分鐘照真的時間倒數、沒有提示、交卷之後才有回顧。
// 不寫圖鑑，也不算完成委託；只留一筆成績。
export const TRIAL_SECONDS = 15 * 60, TRIAL_WARN = 3 * 60, TRIAL_PASS = 60;
/** 第一章走完才開放：先在有人帶的情況下把流程走熟 */
export const trialOpen = (s: Save) => chapterDone(1, s);
/** 抽一位病人。委託板上的四十八位都可能出（終章的那一位不抽），沒遇過的比較容易抽到；不會連續兩次抽到同一位。r 是 0 到 1 的亂數 */
export function pickTrial(s: Save, r: number): CaseDef {
  const last = s.trials[0]?.caseId, pool = CASES.filter((c) => c.id !== FINALE_ID && (c.id !== last || CASES.length === 1));
  // 終章走完之後有十二斧之試：還沒亮的那幾種劫影，抽到的機會多四倍
  const dark = (c: CaseDef) => (finaleDone(s) && !s.beats.includes(AXE(c.complaint)) ? 4 : 1);
  const weight = (c: CaseDef) => (s.cases[c.id] || s.trials.some((t) => t.caseId === c.id) ? 1 : 3) * dark(c);
  let at = Math.min(0.999999, Math.max(0, r)) * pool.reduce((n, c) => n + weight(c), 0);
  for (const c of pool) { at -= weight(c); if (at < 0) return c; }
  return pool[pool.length - 1];
}
// ── 十二斧之試和劫的記號 ──
// 都記在 beats（看過的故事）裡，跟著存檔、匯出和同步走，不用改存檔的格式。
/** 這一位病人的那一劫，你過過一次 */
export const PASSED = (caseId: string) => 'passed:' + caseId;
/** 這一種劫影的斧頭亮了：在它的試弓裡及格過一次 */
export const AXE = (complaint: string) => 'axe:' + complaint;
export const axesLit = (s: Save) => COMPLAINTS.filter((m) => s.beats.includes(AXE(m.id))).map((m) => m.id);
/** 這一種劫影，有幾位病人你過了那一劫 */
export const perilsPassed = (complaint: string, s: Save) => CASES.filter((c) => c.complaint === complaint && s.beats.includes(PASSED(c.id))).length;
/** 吟遊詩人費民每一篇開頭唸的那一句 */
export function bardOf(id: string) { return CANTOS.find((k) => k.id === id)!.invoke; }
/** 這一篇打開了沒有：那座島的章開了；歸航要終章走完；十二斧也是 */
export const cantoOpen = (id: string, s: Save) => {
  const k = CANTOS.find((x) => x.id === id)!;
  return k.island ? chapterOpen(ISLANDS[k.island].chapter, s) : finaleDone(s);
};

/** 把一場試煉的結果記進存檔（新的在前面，最多留 30 筆） */
export function recordTrial(save: Save, c: CaseDef, session: Session, score: Score, seconds: number, timeUp: boolean, at: number, takeaway: string | null = null): Save {
  const rec: TrialRecord = { at, caseId: c.id, score: Math.round(score.total), safety: score.safety, seconds, timeUp, found: harvest(c, session).found };
  const lit = rec.score >= TRIAL_PASS && !save.beats.includes(AXE(c.complaint));
  return { ...save, ...checkIn(save, c, session, at, score, true, takeaway), trials: [rec, ...save.trials].slice(0, 30), beats: lit ? [...save.beats, AXE(c.complaint)] : save.beats };
}

/** 你的陷阱紀錄：最近 TRAPS_SHOWN 場裡，每一種陷阱掉進去幾次、過了幾次。掉進去最多的排前面 */
export function trapProfile(save: Save): { peril: Peril; trapped: number; passed: number; last: boolean }[] {
  const rows = new Map<string, { peril: Peril; trapped: number; passed: number; last: boolean }>();
  for (const t of (save.plays ?? []).slice(0, TRAPS_SHOWN)) {   // 新的在前面，所以第一次碰到的就是最近那一場
    const c = CASES.find((k) => k.id === t.caseId), peril = c && PERILS[c.complaint];
    if (!peril || t.trapped === null) continue;
    const r = rows.get(peril.complaint) ?? { peril, trapped: 0, passed: 0, last: t.trapped };
    if (t.trapped) r.trapped++; else r.passed++;
    rows.set(peril.complaint, r);
  }
  return [...rows.values()].sort((a, b) => b.trapped - a.trapped || b.trapped / (b.trapped + b.passed) - a.trapped / (a.trapped + a.passed));
}

/** 這一場新寫進圖鑑的線索（之前沒有解讀對過的） */
export function newReads(save: Save, c: CaseDef, session: Session) {
  const had = save.cases[c.id]?.reads ?? [];
  return harvest(c, session).reads.filter((r) => !had.some((k) => k.clue === r.clue));
}

/** 圖鑑的一頁：一隻劫影、四個診斷、你在不同病人身上解讀對的線索 */
export function codexOf(m: ComplaintDef, save: Save) {
  // 終章的那一位：遇到了才算進這一頁，之前不占分母（不然第五章走完，這一頁永遠寫不滿）
  const cases = CASES.filter((c) => c.complaint === m.id && (c.id !== FINALE_ID || save.cases[c.id]));
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
  { id: 'cheng', name: '伊安', tag: '善記的・內科病房出身', line: '習慣把每一件事寫下來，筆記本從不離手。', greet: '內科病房來的？寫紀錄的習慣留著，這裡用得上。',
    habit: '還有你自己的習慣。你什麼都寫下來；可是寫得很滿的筆記，看起來會像是都問過了。', own: '我的筆記本裡，也有只寫了一行的。', knack: '紀錄寫得清楚，交班的人一看就懂。', blind: '寫得很滿的筆記，看起來會像是都問過了。', ask: '這一張，你的紀錄裡有哪一格，其實只是照病人的說法寫下來，還沒有自己確認？' },
  { id: 'yuan', name: '艾克', tag: '快腳的・急診出身', line: '手腳很快，正在學慢下來把話問完。巡夜的時候提著一盞小燈。', greet: '急診來的？手腳快是好事。在這裡，先學把話問完。',
    habit: '還有你自己的習慣。你快；快的人，最容易在第一個說得通的答案停下來。', own: '急診那幾年，我也讓人回去過。有幾位，我不知道後來怎麼了。', knack: '一進門就看得出誰不能等。', blind: '第一個說得通的答案，就停下來了。', ask: '如果你一開始想的是錯的，哪一條線索會讓你發現？這一張，你找過它嗎？' },
  { id: 'zhi', name: '帕希', tag: '善聽的・社區巡診出身', line: '很會聽人說話。出診包裡總有一把剛採的草藥。', greet: '社區巡診來的？會聽人說話，就已經贏一半了。',
    habit: '還有你自己的習慣。你會聽；可是有些事光聽是聽不到的，要把手放上去。', own: '巡診的時候，很多人跟我說還撐得住。我都信了。', knack: '會聽，病人願意跟你說。', blind: '聽到「還撐得住」就放心，少做一次客觀的確認。', ask: '這一張，病人說的，和你自己量到、看到的，有沒有哪裡對不上？' },
  { id: 'heng', name: '柏卓', tag: '手穩的・外科病房出身', line: '手很穩，話很少。口袋裡永遠有一捲繃帶。', greet: '外科病房來的？手穩很好。話少沒關係，該問的要問出口。',
    habit: '還有你自己的習慣。你手穩，相信自己摸到的；沒摸到的，也要記一筆「還不知道」。', own: '……我沒摸到的，以前都當作沒有。', knack: '手穩，身體評估做得紮實。', blind: '沒摸到的，就當作沒有。', ask: '這一張，有哪一項其實你沒有做，卻在心裡當成了正常？' },
  { id: 'mu', name: '芙蘿', tag: '溫言的・兒科病房出身', line: '會蹲下來跟孩子說話。手上那隻布做的小魚，是哄人用的。', greet: '兒科病房來的？會蹲下來說話的人，大人也願意跟你講。',
    habit: '還有你自己的習慣。你會讓人放心；可是病人放心了，不代表他沒事。', own: '我讓很多人放心地回去了。後來怎麼了，我很少回頭去問。', knack: '讓人放心，病人肯配合。', blind: '病人放心了，就以為狀況也清楚了。', ask: '病人安心下來之後，你有沒有回頭再確認一件事？是哪一件？' },
  { id: 'qiao', name: '克莉', tag: '數息的・加護病房出身', line: '習慣看著懷錶數呼吸。別人慌的時候，她的聲音會慢下來。', greet: '加護病房來的？你習慣看數字。在這裡，數字之前先看人。',
    habit: '還有你自己的習慣。你看數字；可是數字還正常的時候，人可能已經不對了。', own: '我也等過數字。等它變了，才肯相信人不對。', knack: '看數字的變化很敏銳。', blind: '要等數字變了，才肯相信人不對。', ask: '這一張，數字變之前，人有沒有先變？你是看到哪一樣才確定的？' },
] as const;
export const heroOf = (id: string | null) => HEROES.find((h) => h.id === id) ?? HEROES[0];
/** 故事裡的 {you}、{greet}、{habit}、{own}：換成玩家選的那一位的名字、孟拓見到他說的第一句話、孟拓提醒他的習慣、他自己說的那一句 */
export const toYou = (text: string, hero: string | null) => { const h = heroOf(hero); return text.replaceAll('{you}', h.name).replaceAll('{greet}', h.greet).replaceAll('{habit}', h.habit).replaceAll('{own}', h.own); };
const heroShot = (id: string): Shot => ({ kind: 'hall', hero: id, view: { w: 112, h: 112, cx: 189, cy: 212 } });
export const heroShots = Object.fromEntries(HEROES.map((h) => [h.id, heroShot(h.id)])) as Record<string, Shot>;

export interface Entry { id: string; name: string; tag: string; lines: string[]; shot: Shot; open: boolean; hint: string }
const face = (cx: number, cy: number, w = 104): Shot['view'] => ({ w, h: w, cx, cy });

/** 歸鄉的消息：每一位病人回到生活之後的近況（echoOf 決定玩家看不看得到） */
export const AFTER: Record<string, string> = {
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

/**
 * 歸鄉的消息：病人回到生活之後的近況。診斷對、也回應了他擔心的事，他才會託人帶口信回來；
 * 沒做到的，是公會的前輩接手安頓的。重接這一張、做到了，口信才會到。
 */
export const echoOf = (rec: { found: boolean; concern: boolean }, after: string | undefined) =>
  rec.found && rec.concern && after ? '歸鄉的消息：' + after : '由公會的前輩接手安頓。重接這一張，診斷對、也回應他擔心的事，才會收到他的近況。';
export const echoed = (rec: { found: boolean; concern: boolean } | undefined) => !!rec && rec.found && rec.concern;

/** 人物：公會的人，和你照顧過的病人 */
export function peopleOf(save: Save): { guild: Entry[]; elders: Entry[]; patients: Entry[] } {
  const any = Object.keys(save.cases).length > 0;
  const ch = (n: number) => chapterDone(n, save);
  const guild: Entry[] = [
    { id: 'cen', name: '孟拓', tag: '明眼的・資深專科護理師', lines: ['帶你的人。話不多，問的問題都很準。她的名字借自史詩裡陪少年出海的那位長者：「導師」這個字，就是從他來的。', has(save, ['c02a', 'c02b', 'c03a', 'c03b']) ? '她的紀錄板上，每一位病人只寫三行：他說的、她看到的、還不知道的。' : '她的紀錄板上，每一位病人只寫三行。',
      ...(ch(1) ? ['值夜的時候，她會走到窗邊看燈塔。'] : []), ...(ch(4) ? ['十五年前霧四十天沒有散的那個冬天，她是見習。'] : [])], shot: { kind: 'ward', view: face(297, 178) }, open: true, hint: '' },
    { id: 'mo', name: '費民', tag: '記歌的・公會的檔案員', lines: ['管圖鑑的人。檔案室淹水的那一夜，他搶救到天亮。名字借自史詩裡替人記住故事的吟遊詩人；每一篇的開場，都是他唸的。', '舊索引上「一症一解」的那幾行，是他親手劃掉的。',
      ...(has(save, CH3) ? ['最前面被拆走的那一頁，是他拆的。他沒有燒，藏了十五年。'] : []), ...(ch(5) ? ['新的圖鑑，他把那一頁訂回了最前面。'] : [])], shot: { kind: 'hall', view: face(74, 152) }, open: true, hint: '' },
    { id: 'shen', name: '馬凱', tag: '手穩的・值班醫師', lines: ['值班鐘一響就會出現。', '他只說一句：「告訴我重點。」',
      ...(has(save, CH4_HALF) ? ['這一句，是四十天霧之後才開始問的。問了，他就會聽完。'] : [])], shot: { kind: 'ward', doctor: true, view: face(326, 170) }, open: any, hint: '完成第一張委託之後' },
    { id: 'dong', name: '歐律克勒亞', tag: finaleDone(save) ? '守燈的・71 歲，燈塔的守燈人' : '寫舊索引的人', lines: ['孟拓的老師。十五年前的冬天，她寫出了那本「一隻劫影一行字」的索引。', ...(has(save, CH5_HALF) ? ['後來守著燈塔。那盞燈十五年沒有熄過，她也沒有下來過。'] : ['沒有人說她後來去了哪裡。']),
      ...(finaleDone(save) ? ['大霧的那一夜，她說「還撐得住」。' + (save.cases[FINALE_ID].found ? '你沒有照她的話看，也沒有照索引看。' : '那一夜的診斷，你還沒有對過。'), '她留了三行字給你。'] : [])],
      shot: finaleDone(save) ? { kind: 'ward', patient: 'dong', scene: 'tower', view: face(92, 170) } : { kind: 'hall', view: face(87, 84, 62) }, open: has(save, CH3_HALF), hint: '第三章走到一半之後' },
  ];
  const patients: Entry[] = CASES.filter((c) => c.id !== FINALE_ID).map((c) => {
    const rec = save.cases[c.id], truth = c.forms.find((f) => f.id === c.answer.truth)!;
    return {
      id: c.id, name: c.patient.name, tag: c.patient.age + ' 歲，' + c.patient.job,
      lines: [rec?.found ? '診斷：' + truth.name + '。' : '還沒有診斷對過。', ...(rec ? [echoOf(rec, AFTER[c.id])] : [])],
      shot: { kind: 'ward', patient: c.patient.look, scene: c.scene, view: face(92, 170) }, open: !!rec, hint: '看完' + c.patient.name + '（' + c.complaintName + '）之後',
    };
  });
  const voteKnown = has(save, CH3), revoted = chapterDone(5, save);
  const elders: Entry[] = ELDERS.map((e) => ({
    id: e.id, name: e.name, tag: e.tag,
    lines: [...e.bio, '怎麼問：' + e.knack, '盲點：' + e.blind, '口頭禪：「' + e.motto + '」',
      ...(voteKnown ? ['十五年前那一票：' + (e.voted ? '訂上去。' : '不訂。') + (revoted ? '今年重新表決：訂上去。' : '')] : [])],
    shot: { kind: 'ward', patient: 'e-' + e.id, view: face(92, 170) },
    open: chapterOpen(elderChapter(e.id) - (e.id === 'nie' ? 1 : 0), save) && (e.id !== 'nie' || chapterDone(1, save)),
    hint: e.id === 'nie' ? '第一章走完之後' : CHAPTERS_ZH[ISLANDS[e.island].chapter] + '，到' + ISLANDS[e.island].name + '的時候',
  }));
  return { guild, elders, patients };
}

/** 場景：去過的地方。一劫一座島，每座島一間公會的診間；出診到碼頭；終章上燈塔 */
export function placesOf(save: Save): Entry[] {
  const any = Object.keys(save.cases).length > 0;
  const been = (id: IslandId) => questsOn(id).some((q) => save.cases[q.caseId]);
  const who = (id: IslandId) => { const k = ISLANDS[id].resident; if (!k || !been(id)) return []; const r = RESIDENTS[k]; return [r.name + '（' + r.tag + '）：' + r.habit, ...r.lines]; };
  const room = (id: IslandId, lines: string[]): Entry => {
    const i = ISLANDS[id], place = i.places[0], first = caseById(questsOn(id)[0].caseId);
    return { id: place, name: PLACES[place].name, tag: i.name + '・' + CHAPTERS_ZH[i.chapter], lines: [...lines, ...i.lines.slice(-1), ...who(id)],
      shot: { kind: 'ward', patient: i.resident ? RESIDENTS[i.resident].look : first.patient.look, scene: place }, open: been(id), hint: '在' + i.name + '完成第一張委託之後' };
  };
  return [
    { id: 'hall', name: '公會大廳', tag: '伊塔洛斯', lines: ['委託板、費民的櫃台、看得到燈塔的拱窗。每一張委託從這裡開始，也回到這裡。'], shot: { kind: 'hall' }, open: true, hint: '' },
    { id: 'ward', name: PLACES.ward.name, tag: '伊塔洛斯・第一章', lines: ['大廳旁邊那扇門。一張床、一張桌子、一口值班鐘。窗台上那隻貓不屬於任何人。', '下雨天，窗外的樹會安靜下來。', ...who('main')], shot: { kind: 'ward', patient: 'r-lan' }, open: any, hint: '完成第一張委託之後' },
    { id: 'dock', name: PLACES.dock.name, tag: '每一座島都有・出診', lines: ['船一靠岸，走不到公會的人就先扶進這裡。每一座島的碼頭邊，都有這樣一間。', '出診的時候，孟拓會把值班鐘一起帶來，掛在樑上。'], shot: { kind: 'ward', patient: 'zhou', scene: 'dock' }, open: !!save.cases.c01d, hint: '完成「靠岸的那天早上」之後' },
    room('wind', ['借的是斯克里亞魚市診間的格局：帆坊的人沒空過海，公會就在帆坊旁邊擺了一張床。']),
    room('tide', ['斯克里亞的魚市天沒亮就開，不舒服的人也不肯搭船。公會在魚市口留了一間診間。', '窗外就是魚市的棚子。那隻貓，在這裡待得最久。']),
    room('sun', ['藥舍的繩子上晾的是藥草的標籤，跟法羅斯晾舊索引的樣子很像。']),
    room('book', ['法羅斯的檔案室隔壁，公會最早的一間診間，很久沒有人用。牆上那一道線，是大潮那一夜的水痕。', '繩子上晾著一張一張舊索引。墨暈開的那幾張，費民說還認得出來。']),
    room('keel', ['公會跟拉莫斯的船塢借的工寮。門外的船台上，有一艘造到一半的船。', '來這裡的人，多半是放下手上的活、撐著走過來的。']),
    room('boar', ['山腳的木工棚，劈柴和修獵具的聲音從早響到晚。']),
    room('whirl', ['潮閘旁的工寮。地板底下就是水道，漲潮和退潮聽得一清二楚。']),
    room('lotus', ['果園邊的一間靜室。門一關，外面摘果子的人就聽不到裡面說話。']),
    room('circe', ['林子深處的一間靜室。來這裡的人，多半是因為身上的樣子變了。']),
    room('bamboo', ['歐吉吉亞坡頂的一間。門關得起來，屏風拉得上。圓窗看出去是整片海，遠遠的是本島的燈塔。', '有些話，要在這樣的地方才問得出來。']),
    room('shade', ['霧岸上的一間靜室，白天也點著燈。']),
    { id: 'tower', name: PLACES.tower.name, tag: finaleDone(save) ? '終章' : '還沒去過', lines: finaleDone(save) ? ['燈室底下的一間圓房間。架上一排值夜日誌，一年一本，十五本。', '大霧的那一夜，燈熄過一次。天亮之前，有人把它點回來了。'] : [],
      shot: { kind: 'ward', patient: 'dong', scene: 'tower', lit: true }, open: finaleDone(save), hint: finaleOpen(save) ? '終章：大霧值班夜' : '第五章走完之後' },
  ];
}
/** 一張委託（病例）在哪一座島：看它的主訴平常在哪一間 */
export const islandOf = (c: { complaint: string }): IslandId => ISLAND_OF[homeOf(c)] ?? 'main';
/** 這座島上的委託（終章那一張不算，它在燈塔） */
export const questsOn = (id: IslandId) => QUESTS.filter((q) => islandOf(caseById(q.caseId)) === id);
const CHAPTERS_ZH: Record<number, string> = { 1: '第一章', 2: '第二章', 3: '第三章', 4: '第四章', 5: '第五章' };

/** 劫影那一頁整體寫回了多少：每隻劫影的百分比平均 */
export const codexPercent = (list: ComplaintDef[], save: Save) => (list.length ? Math.round(list.reduce((n, m) => n + codexOf(m, save).percent, 0) / list.length) : 0);

/** 人物和場景加起來打開了幾個 */
export function albumCount(save: Save): { got: number; total: number } {
  const { guild, elders, patients } = peopleOf(save), all = [...guild, ...elders, ...patients, ...placesOf(save)];
  return { got: all.filter((e) => e.open).length + HEROES.length, total: all.length + HEROES.length };
}

/** 第幾章已經開了（第一章一開始就開；之後是前一章走完） */
export const chapterOpen = (n: number, s: Save) => n <= 1 || chapterDone(n - 1, s);
/** 病室裡「要提示」的時候，除了孟拓還可以請教誰：去過那座島、見過的那幾位長老 */
export const eldersFor = (s: Save) => eldersMet((n) => chapterOpen(n, s));

/** 這一張委託平常在哪一間看（出診的貨棧，算在那一章的島） */
export const homeOf = (c: { complaint: string }) => COMPLAINTS.find((m) => m.id === c.complaint)?.place ?? 'ward';

// ── 下一步 ──
// 大廳最上面那一張卡：一次只說一件事。現在該做什麼、為什麼、按一下就帶過去。
// 新的東西第一次出現的時候，在這裡說明它是什麼；還沒輪到的東西，大廳先不擺出來。
export type NextAction =
  | { kind: 'resume' }
  | { kind: 'quest'; caseId: string; island: IslandId }
  | { kind: 'night' } | { kind: 'tower' } | { kind: 'trial' } | { kind: 'tide'; n: number } | { kind: 'codex' };
export interface NextStep { title: string; why: string; button: string; action: NextAction }

/** pending：上次沒結案的那一張（試弓也算），沒有就是 null */
export function nextStep(s: Save, pending: { caseId: string; trial: boolean; closed: boolean } | null): NextStep {
  if (pending) {
    const c = caseById(pending.caseId);
    if (pending.trial) return { title: pending.closed ? '試弓交卷了，去看成績' : '試弓考到一半', why: pending.closed ? '成績和回顧要看完，這一場才算數。' : '倒數會從你離開的時候接下去。', button: pending.closed ? '看成績' : '接著考', action: { kind: 'resume' } };
    return { title: pending.closed ? c.patient.name + '結案了，去看回顧' : c.patient.name + '還在等你', why: pending.closed ? '回顧裡會告訴你哪裡做到、哪裡漏了，還有這一劫有沒有被困住。看完才會寫進圖鑑。' : '上次做到一半，回來可以接著做。', button: pending.closed ? '看回顧' : '接著做', action: { kind: 'resume' } };
  }
  const done = Object.keys(s.cases).length, q = QUESTS.find((x) => unlocked(x, s) && !s.cases[x.caseId]);
  if (q) {
    const c = caseById(q.caseId), isle = islandOf(c), i = ISLANDS[isle], left = questsOn(isle).filter((x) => !s.cases[x.caseId]).length;
    const action: NextAction = { kind: 'quest', caseId: c.id, island: isle };
    if (!done) return { title: '接下第一張委託：' + c.patient.name + '（' + c.complaintName + '）', why: '一張委託就是一位病人。順序和考站一樣：問診 → 身體評估 → 下診斷 → 檢查、向醫師回報 → 跟病人說明。卡住了，按「要提示」。', button: '看委託單', action };
    if (!questsOn(isle).some((x) => s.cases[x.caseId])) return { title: CHAPTERS_ZH[q.chapter] + '：坐巡診船到' + i.name + '（' + c.complaintName + '）', why: '新的症狀：' + c.complaintName + '。航海圖上，有字的島就是可以去的地方；' + i.name + '的病人都是因為' + c.complaintName + '來的。', button: '去' + i.name, action };
    return { title: '接下' + c.patient.name + '的委託（' + c.complaintName + '）', why: '這座島的病人都是' + c.complaintName + '，還有 ' + left + ' 張沒結。同一個症狀，每一位背後的病都可能不一樣。', button: '看委託單', action };
  }
  if (finaleOpen(s) && !nightDone(s)) return { title: '終章：大霧值班夜', why: '燈塔熄了，今晚門口會同時來好幾位。這一場練的是分流：先看誰、另一位交給誰、什麼時候回頭。', button: '進值班夜', action: { kind: 'night' } };
  if (towerOpen(s) && !finaleDone(s)) return { title: '最後一張委託：燈塔', why: '送燈油的人帶了一句話下來。這一張要你自己判斷，等不等得了。', button: '看委託單', action: { kind: 'tower' } };
  if (finaleDone(s)) {
    const n = 12 - axesLit(s).length;
    if (n > 0) return { title: '十二斧之試：還有 ' + n + ' 把沒亮', why: '試弓照真的口試走：抽一位病人、15 分鐘、沒有提示。在一種劫影的試弓及格一次，那一把斧頭就亮；還沒亮的比較容易抽到。', button: '去試弓', action: { kind: 'trial' } };
    return { title: '十二把斧頭都亮了', why: '想再練，可以重接舊的委託把圖鑑寫滿，或再考一次試弓。', button: '打開圖鑑', action: { kind: 'codex' } };
  }
  // 委託都結了、下一章還沒開（照現在的規則不會發生；留著讓大廳永遠有一句話）
  return { title: '圖鑑還有空白', why: '重接舊的委託，少了提示，你看到的東西會不一樣。', button: '打開圖鑑', action: { kind: 'codex' } };
}

/** 次要的建議（選做）：一章走完的海神的風暴、第一章之後開放的試弓。一次最多一句 */
export function sideStep(s: Save): { text: string; button: string; action: NextAction } | null {
  const tide = [2, 3, 4, 5].find((n) => chapterDone(n, s) && !s.beats.includes(TIDE_DONE(n)));
  if (tide) return { text: CHAPTERS_ZH[tide] + '走完了。選做：海神的風暴，這一章的兩位同一刻到門口，先看誰？', button: '推演', action: { kind: 'tide', n: tide } };
  if (trialOpen(s) && !s.trials.length && !finaleDone(s)) return { text: '選做：試弓已經開放。想知道真的口試是什麼感覺，可以先考一次，不影響委託。', button: '看規則', action: { kind: 'trial' } };
  return null;
}

// ── 你在哪裡 ──
// 首頁和大廳最上面那一條：五章加終章，每一段做了幾張、現在在哪一段。
export interface Leg { key: string; short: string; name: string; place: string; done: number; total: number; state: 'done' | 'now' | 'later' }
const HUB: Record<number, IslandId> = { 1: 'main', 2: 'tide', 3: 'book', 4: 'keel', 5: 'bamboo' };
export function journey(s: Save): { legs: Leg[]; now: Leg; done: number; total: number } {
  const legs: Leg[] = [1, 2, 3, 4, 5].map((n) => {
    const qs = QUESTS.filter((q) => q.chapter === n), isles = new Set(qs.map((q) => islandOf(caseById(q.caseId))));
    const place = ISLANDS[HUB[n]].name + (isles.size > 1 ? '一帶（' + isles.size + ' 座島）' : '');
    return { key: 'ch' + n, short: '一二三四五'[n - 1], name: CHAPTERS_ZH[n], place, done: qs.filter((q) => s.cases[q.caseId]).length, total: qs.length, state: chapterDone(n, s) ? 'done' : chapterOpen(n, s) ? 'now' : 'later' };
  });
  const fin = [nightDone(s), finaleDone(s)].filter(Boolean).length;
  legs.push({ key: 'end', short: '終', name: '終章', place: '值班夜和燈塔', done: fin, total: 2, state: finaleDone(s) ? 'done' : finaleOpen(s) ? 'now' : 'later' });
  const now = legs.find((l) => l.state === 'now') ?? legs[legs.length - 1];
  return { legs, now, done: QUESTS.filter((q) => s.cases[q.caseId]).length, total: QUESTS.length };
}
