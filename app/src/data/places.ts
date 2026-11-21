// 霧海裡看診的地方。一劫一座島，每座島一間公會的診間（見 islands.ts）：
// 每一章的委託在其中一間看，哪個主訴在哪一間寫在主訴模組（place）。
// 病例的內容不跟著地方變；地方只決定畫面，和故事裡為什麼要到那裡去。
import type { Place, Scene } from '../core/types.ts';
import { ISLANDS, ISLAND_OF } from './islands.ts';
const ISLAND_NAME = Object.fromEntries(Object.values(ISLANDS).map((i) => [i.id, i.name])) as Record<string, string>;

/** name 全名；at 給螢幕報讀器的那一句；enter 進門的時候畫面上的一句旁白（公會的病室和出診不用：病室是預設，出診的病例自己會說；試弓不說） */
export const PLACES: Record<Place, { name: string; at: string; enter?: string }> = {
  ward: { name: '公會的病室', at: '伊塔洛斯，霧脈公會的病室', enter: '本島，公會的病室。歐邁雅在床尾掛好一塊新的紀錄板，三格都是空的。' },
  market: { name: '魚市口的診間', at: '斯克里亞，公會在魚市口的診間', enter: '斯克里亞，魚市口的診間。瑙希卡把門口的竹簾捲起來；喊價的聲音隔著牆傳進來。' },
  archive: { name: '檔案室旁的舊病室', at: '法羅斯，公會檔案室旁邊的舊病室', enter: '法羅斯，檔案室旁的舊病室。埃多忒在繩子上晾著一張一張泡過水的舊索引。' },
  yard: { name: '船塢的工寮', at: '拉莫斯，公會在船塢借的工寮', enter: '拉莫斯，船塢的工寮。門特斯在門上的板子記下公會借走的東西；門外的船台上，有一艘造到一半的船。' },
  quiet: { name: '坡上的靜室', at: '歐吉吉亞，公會在坡上的靜室', enter: '歐吉吉亞，坡上的靜室。瑪伊拉試了一次屏風，拉得攏。門關上之後，只剩窗外很遠的海。' },
  wind: { name: '帆坊旁的診間', at: '埃俄利亞，帆坊旁的診間', enter: '埃俄利亞，帆坊旁的診間。整座島的帆都在這裡縫，風從牆的每一條縫鑽進來。' },
  sun: { name: '藥舍改成的診間', at: '特里納基亞，藥舍改成的診間', enter: '特里納基亞，藥舍改成的診間。繩子上晾著一串一串的藥草；窗外的坡上，是一群不能碰的牛。' },
  boar: { name: '山腳的木工棚', at: '帕納索，山腳的木工棚', enter: '帕納索，山腳的木工棚。獵人在這裡修工具，牆上掛著一根很舊的野豬獠牙。' },
  whirl: { name: '潮閘旁的工寮', at: '卡律布狄斯，潮閘旁的工寮', enter: '卡律布狄斯，潮閘旁的工寮。外面的漩渦一天三次把水吞進去、再吐出來，地板跟著漲落的聲音一起響。' },
  lotus: { name: '果園邊的靜室', at: '洛托法吉，果園邊的靜室', enter: '洛托法吉，果園邊的靜室。屋外的樹結著甜果子；門一關，外面的人就聽不到裡面說話。' },
  circe: { name: '林中的靜室', at: '埃埃亞，林中的靜室', enter: '埃埃亞，林中的靜室。牆上的鏡子用布蓋著，屏風拉得上。' },
  shade: { name: '霧岸的靜室', at: '辛梅里亞，霧岸的靜室', enter: '辛梅里亞，霧岸的靜室。窗外終年是霧；這裡的人說話很小聲，要你先開口問。' },
  dock: { name: '碼頭的貨棧', at: '碼頭的貨棧' },
  tower: { name: '燈塔的值夜房', at: '伊塔洛斯，燈塔的值夜房', enter: '燈塔的值夜房。窗外只有霧；頭頂上的燈室是暗的。' },
};
export const placeOf = (scene: Scene): Place => scene.replace('-rain', '') as Place;
export const rainy = (scene: Scene) => scene.endsWith('-rain');
/** 審查清單和圖鑑用的全名 */
export const sceneName = (scene: Scene) => PLACES[placeOf(scene)].name + (rainy(scene) ? '（下雨天）' : placeOf(scene) === 'dock' ? '（出診）' : '');

/** 哪一座島。出診的貨棧沒有固定的島：看那一張委託平常在哪一間（home） */
export const islandName = (scene: Scene, home: Place = 'ward') => { const p = placeOf(scene); return ISLAND_NAME[ISLAND_OF[p === 'dock' ? home : p] ?? 'main']; };
/** 委託單上的地點：島名＋地方 */
export const whereOf = (scene: Scene, home: Place = 'ward') => islandName(scene, home) + '・' + sceneName(scene);
