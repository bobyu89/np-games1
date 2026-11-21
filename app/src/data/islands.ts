// 霧海群島：五座島、每座島的長老（五島長老會的五位老醫生）、每間診間的常駐的人。
// 這裡只放世界的資料。病例不認得這裡的任何東西：病例的內容不跟著島變，島只決定畫面、故事，和「請教」的時候有誰可以問。
import type { Place } from '../core/types.ts';

export type IslandId = 'main' | 'tide' | 'book' | 'keel' | 'bamboo';

/** 「請教」的時候，老醫生會看的缺口。全部只看玩家這一場做了什麼、還沒做什麼，不看這位病人的答案 */
export type Gap =
  | 'open' | 'cc' | 'hx' | 'concern' | 'ros' | 'vitals' | 'exam' | 'explainFirst'
  | 'board' | 'recheck' | 'urgency' | 'tests' | 'exclude' | 'report' | 'tell';

/** 回顧裡講「還沒做的是哪一項」用的名字 */
export const GAP_NAME: Record<Gap, string> = {
  open: '開場：洗手、核對身分、說明流程', cc: '主訴的細節：什麼時候開始、怎麼不舒服、什麼會加重', hx: '過去病史、用藥、生活', concern: '他自己最擔心什麼',
  ros: '系統回顧', vitals: '量生命徵象', exam: '身體評估的部位', explainFirst: '動手之前先向病人說明', board: '下診斷',
  recheck: '狀況變了之後重量生命徵象', urgency: '判斷他等不等得了', tests: '提出檢查', exclude: '要排除的診斷，找一條談它的線索',
  report: '向醫師回報', tell: '向病人說明',
};

export interface Elder {
  id: string; name: string; island: IslandId; pronoun: '他' | '她';
  /** 年紀、出身，一兩句 */
  tag: string; bio: string[];
  /** 他怎麼問：專長是一種問法，不是一個科 */
  knack: string;
  /** 他的盲點：一種推理錯誤 */
  blind: string;
  /** 口頭禪 */
  motto: string;
  /** 請教他要花的模擬時間（秒）：打燈號叫他、他過來、他講完 */
  sec: number;
  /** 缺口出現的時候先提哪一類 */
  order: Gap[];
  /** 他永遠不會提的那幾類：這就是他的盲點 */
  never: Gap[];
  /** 他提每一類缺口時說的話。{who} 換成病人的名字 */
  say: Partial<Record<Gap, string>>;
  /** 他在乎的都做了（或者剩下的都是他不會提的）的時候說的話 */
  none: string;
  /** 十五年前，五島長老會表決要不要把勘誤訂在圖鑑第一頁。true：訂上去 */
  voted: boolean;
}

export interface Resident { id: string; name: string; tag: string; look: string; lines: string[]; habit: string }

export interface Island {
  id: IslandId; name: string; tag: string; lines: string[];
  /** 這座島上公會的診間（第幾章在這裡）。本島另外有大廳和燈塔 */
  places: Place[]; chapter: number;
  elder: string; resident: string;
  /** 航海圖上的位置（0～1000 × 0～700）和輪廓的大小 */
  x: number; y: number; r: number;
}

export const ISLANDS: Record<IslandId, Island> = {
  main: {
    id: 'main', name: '伊塔洛斯', tag: '公會本館・第一章', chapter: 1, places: ['ward', 'tower'], elder: 'nie', resident: 'lan',
    lines: ['群島的主港。公會的大廳、委託板和最早的一間病室都在這裡；岬角上是燈塔。', '每一張委託從這裡的大廳開始。外島的委託，搭巡診船去，結案回港。'],
    x: 470, y: 380, r: 120,
  },
  tide: {
    id: 'tide', name: '斯克里亞', tag: '魚市口的診間・第二章', chapter: 2, places: ['market'], elder: 'lu', resident: 'xi',
    lines: ['退潮的時候，灘上會露出一整片市集。群島的魚，天沒亮就在這裡喊價。', '魚市的人不肯爬坡、也不肯搭船過來看病，公會就在魚市口開了一間診間。'],
    x: 170, y: 230, r: 70,
  },
  book: {
    id: 'book', name: '法羅斯', tag: '檔案室旁的舊病室・第三章', chapter: 3, places: ['archive'], elder: 'guan', resident: 'luan',
    lines: ['本島東邊一座低低的小島，退潮的時候走得過去。公會的檔案庫在這裡：紙要離人多的地方遠一點。', '公會最早就是在這座島上開的。檔案室隔壁那間舊病室，是第一間診間。', '地勢低，大潮常淹到門口。淹進櫃子裡的那種潮，十五年才來一次。'],
    x: 700, y: 300, r: 48,
  },
  keel: {
    id: 'keel', name: '拉莫斯', tag: '船塢的工寮・第四章', chapter: 4, places: ['yard'], elder: 'chu', resident: 'duo',
    lines: ['群島的船，大多在這裡的船塢造。島上整天都是鋸木頭和敲鉚釘的聲音。', '船塢趕工的時候，沒有人肯放下手上的活。公會跟船塢借了一間工寮。'],
    x: 760, y: 560, r: 78,
  },
  bamboo: {
    id: 'bamboo', name: '歐吉吉亞', tag: '坡上的靜室・第五章', chapter: 5, places: ['quiet'], elder: 'ge', resident: 'lu2',
    lines: ['竹林一直長到海邊，坡很陡，屋子一間比一間高。', '坡頂上那間靜室，門關得起來，屏風拉得上。說不出口的話，公會帶到這裡來問。'],
    x: 220, y: 560, r: 74,
  },
};

/** 每間診間在哪一座島。出診的貨棧，在那一章的那座島（看病例的主訴在哪一間） */
export const ISLAND_OF: Partial<Record<Place, IslandId>> = { ward: 'main', tower: 'main', market: 'tide', archive: 'book', yard: 'keel', quiet: 'bamboo' };

export const ELDERS: Elder[] = [
  {
    id: 'nie', name: '埃吉普提歐', island: 'main', pronoun: '他', voted: false,
    tag: '72 歲・手粗的會首・五島長老會', bio: ['年輕的時候跟著巡診船跑外島三十年。那些地方沒有檢查可做，只能靠眼睛和手。', '現在是公會的會首，長老會開會的時候坐在最上面。'],
    knack: '身體評估：先量，再一個部位一個部位摸，兩邊比。', blind: '太相信自己摸得到的。摸不到的就當作沒有，病史常常跳過。',
    motto: '手放上去再說。', sec: 20,
    order: ['vitals', 'exam', 'explainFirst', 'recheck', 'board', 'urgency', 'tests', 'report'],
    never: ['cc', 'hx', 'concern', 'ros', 'tell'],
    say: {
      vitals: '你量過{who}了嗎？手還沒放上去，就先別說話。', exam: '評估你做了幾個部位？還沒碰的，從頭到腳一個一個來。', explainFirst: '動手之前，你沒先跟{who}說要做什麼。',
      recheck: '{who}的樣子變了。你手上的數字是剛才的，再量一次。', board: '摸完了，就說你的判斷。', urgency: '你下了診斷。{who}等不等得了，你自己看，不要問我。',
      tests: '你的診斷，靠哪一項檢查回答？你一項都還沒提。', report: '看完了就去報給值班的醫師。',
    },
    none: '該摸的你都摸了。去下一步。',
  },
  {
    id: 'lu', name: '瑙西克拉', island: 'tide', pronoun: '她', voted: false,
    tag: '66 歲・數潮的・斯克里亞的老醫生', bio: ['年輕的時候在斯克里亞的潮汐站抄潮位，每兩個時辰記一筆。三十歲才到公會學。', '分站的紀錄表，全是她畫的。'],
    knack: '數字和時間：哪個數字是什麼時候量的、開了的檢查回來了沒、從下診斷到現在過了多久。', blind: '只看數字，不聽人。數字在範圍裡就放心，不再追問。',
    motto: '數字不會騙人。', sec: 20,
    order: ['vitals', 'recheck', 'tests', 'urgency', 'board', 'exam', 'cc', 'report'],
    never: ['concern', 'tell', 'hx', 'explainFirst'],
    say: {
      vitals: '你手上一個數字都沒有。先量。', recheck: '血壓和心跳是幾分鐘前量的？那之後你做了多少事？再量一次。', tests: '你開了幾項檢查？零項。你的判斷要靠什麼確認？',
      urgency: '從你下診斷到現在，時間一直在走。{who}等不等得了，你要有個說法。', board: '數字都在你手上了。把它們排一排，說出你的判斷。', exam: '評估做了幾項？少於四項的紀錄，我不收。',
      cc: '從什麼時候開始、多久了、幾分痛。這三個數字你還沒問齊。', report: '數字齊了就去報。',
    },
    none: '數字我看過了，都對得上。',
  },
  {
    id: 'guan', name: '涅斯托', island: 'book', pronoun: '他', voted: true,
    tag: '77 歲・話長的・法羅斯的老醫生', bio: ['法羅斯土生土長，島上第一個去公會學又回來的人。看了五十年，記得每一位病人的名字和那一年的天氣。', '十五年前的勘誤上那十一個名字，他每一個都認得。'],
    knack: '時間線：從哪一天開始、先有什麼後有什麼、在什麼事之後。', blind: '錨定在自己看過的舊案例；相信一開始的經過，不回頭看現在。',
    motto: '我年輕的時候也看過一個……', sec: 40,
    order: ['cc', 'hx', 'ros', 'open', 'exam', 'board', 'report', 'tell'],
    never: ['recheck', 'tests', 'exclude', 'vitals'],
    say: {
      cc: '我年輕的時候也看過一個，也是說不清楚。那時候我先問的是：從哪一天開始的、怎麼變的。你問了幾個？', hx: '這件事之前，{who}是什麼樣子？以前的病、吃的藥、怎麼過日子，你問了幾樣？',
      ros: '從頭到腳再問一遍。我看過太多人，自己沒說的那一樣才是要緊的。', open: '先把開場做完。人家連你是誰都還不知道。',
      exam: '問完了，就去看。我年輕的時候也是這樣，一樣一樣看。', board: '把經過從頭排一次，說你的判斷。', report: '把經過報給值班的醫師。從頭講，講清楚。', tell: '{who}還不知道自己怎麼了。跟{who}說。',
    },
    none: '經過你都問齊了。跟我當年看過的那一個，很像。',
  },
  {
    id: 'chu', name: '狄俄墨', island: 'keel', pronoun: '他', voted: false,
    tag: '63 歲・快腳的・拉莫斯的老醫生', bio: ['外地人。年輕的時候在別的港口守夜裡的救護棚，十年前搬來拉莫斯，船塢一出事就是他先到。', '說話短，站著不坐。'],
    knack: '危險徵象：一進門先看呼吸、意識、生命徵象，先問等不等得了、要不要叫人。', blind: '太急。每一位都當成最壞的那一種，病史和說明都跳過。',
    motto: '先看他等不等得了。', sec: 10,
    order: ['vitals', 'recheck', 'urgency', 'exam', 'board', 'tests', 'report'],
    never: ['hx', 'ros', 'concern', 'tell', 'cc'],
    say: {
      vitals: '{who}現在等得了嗎？你連血壓都還沒量。', recheck: '人變了，數字是舊的。再量。', urgency: '你下了診斷。{who}等不等得了？等不了就叫人，等得了就照順序來。你要有個說法。',
      exam: '看了幾個部位？先看最要命的。', board: '快，說你的判斷。', tests: '你要的檢查，一項都還沒提。', report: '報。',
    },
    none: '要命的地方你都看過了。',
  },
  {
    id: 'ge', name: '阿瑞忒', island: 'bamboo', pronoun: '她', voted: true,
    tag: '81 歲・聽完的・歐吉吉亞的老醫生', bio: ['歐吉吉亞人。在坡頂那間靜室看了四十多年，島上一半的人是她看著長大的。', '一邊縫衣服一邊聽，一句一句問，從來不催。'],
    knack: '隱私和生活：吃什麼藥、家裡有誰、做什麼工作、自己最擔心什麼。', blind: '太相信病人自己的說法，順著他的話問下去，遲遲不去驗證。',
    motto: '讓他說完。', sec: 60,
    order: ['open', 'concern', 'hx', 'cc', 'ros', 'tell', 'explainFirst', 'report'],
    never: ['vitals', 'exam', 'recheck', 'urgency'],
    say: {
      open: '你連自己是誰都還沒說，人家怎麼跟你說心裡話。', concern: '{who}最擔心的是什麼，你還沒問。', hx: '吃什麼藥、家裡有誰、做什麼工作。這些{who}不會自己說，你要問。',
      cc: '{who}自己覺得是怎麼了？讓他說完。', ros: '其他地方有沒有不舒服，慢慢問一遍。', tell: '{who}還在等你告訴他，他怎麼了。', explainFirst: '動手之前，你沒先跟{who}說。',
      report: '去跟醫師說吧，說{who}在擔心什麼。',
    },
    none: '{who}想說的，都說完了。',
  },
];
export const elderOf = (id: string) => ELDERS.find((e) => e.id === id)!;

export const RESIDENTS: Record<string, Resident> = {
  lan: { id: 'lan', name: '歐邁雅', tag: '本島病室的助理', look: 'r-lan', habit: '每一位病人進門，她都在床尾掛一塊新的紀錄板，上面三格是空的。',
    lines: ['她不看病。床單、水壺、紀錄板，都是她在顧。', '「三格都空著，是給你寫的，不是給我。」'] },
  xi: { id: 'xi', name: '瑙希卡', tag: '斯克里亞診間的接待', look: 'r-xi', habit: '魚市太吵，她聽不清楚的時候，一定請人再說一遍，照原話寫在門口的竹板上。',
    lines: ['魚販的女兒，天沒亮就把診間的門打開。', '「我寫的是他說的，不是我聽到的。這兩個不一樣。」'] },
  luan: { id: 'luan', name: '埃多忒', tag: '法羅斯修紙的工匠', look: 'r-luan', habit: '泡過水的紙，他晾乾之後，看得清的字照抄，看不清的地方留白，寫上「這裡缺」。',
    lines: ['淹水之後，是他陪斐米歐把一張一張索引晾在繩子上。', '「看不清的地方不能猜。猜了，下一個人就以為那是真的。」'] },
  duo: { id: 'duo', name: '門特斯', tag: '拉莫斯工寮的管事', look: 'r-duo', habit: '工寮借出去的每一樣東西，交給誰、什麼時候回來清點，他都寫在門上的板子上。交班的時候一樣一樣念。',
    lines: ['退休的船匠，把工寮讓給公會用，自己顧著門。', '「交出去的東西，沒有說什麼時候回來看，就等於丟了。」'] },
  lu2: { id: 'lu2', name: '瑪伊拉', tag: '歐吉吉亞靜室的房務', look: 'r-lu', habit: '每一次收房，她都試一次屏風拉不拉得攏、門關不關得緊；關不緊的，交代下一班修好才能用。',
    lines: ['靜室的屏風和門，是她在顧。', '「屏風拉不攏，人家就不會說。這不是小事。」'] },
};

/** 某一章的長老（第一章是會首埃吉普提歐） */
export const elderOfChapter = (ch: number) => ELDERS.find((e) => ISLANDS[e.island].chapter === ch)!;
