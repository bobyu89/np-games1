// 霧港裡看診的地方。前五個是公會的診間：每一章的委託在其中一間看，哪個主訴在哪一間寫在主訴模組（place）。
// 病例的內容不跟著地方變；地方只決定畫面，和故事裡為什麼要到那裡去。
import type { Place, Scene } from '../core/types.ts';

/** name 全名；at 給螢幕報讀器的那一句；enter 進門的時候畫面上的一句旁白（公會的病室和出診不用：病室是預設，出診的病例自己會說；資格試煉不說） */
export const PLACES: Record<Place, { name: string; at: string; enter?: string }> = {
  ward: { name: '公會的病室', at: '霧脈公會的病室' },
  market: { name: '魚市口的診間', at: '公會在魚市口的診間', enter: '魚市口的診間。窗外就是魚市，喊價的聲音隔著牆傳進來。' },
  archive: { name: '檔案室旁的舊病室', at: '公會檔案室旁邊的舊病室', enter: '檔案室旁的舊病室。繩子上晾著一張一張泡過水的舊索引。' },
  yard: { name: '船塢的工寮', at: '公會在船塢借的工寮', enter: '船塢的工寮。門外的船台上，有一艘造到一半的船。' },
  quiet: { name: '坡上的靜室', at: '公會在坡上的靜室', enter: '坡上的靜室。門關上之後，只剩窗外很遠的海。' },
  dock: { name: '碼頭的貨棧', at: '碼頭的貨棧' },
  tower: { name: '燈塔的值夜房', at: '燈塔的值夜房', enter: '燈塔的值夜房。窗外只有霧；頭頂上的燈室是暗的。' },
};
export const placeOf = (scene: Scene): Place => scene.replace('-rain', '') as Place;
export const rainy = (scene: Scene) => scene.endsWith('-rain');
/** 審查清單和圖鑑用的全名 */
export const sceneName = (scene: Scene) => PLACES[placeOf(scene)].name + (rainy(scene) ? '（下雨天）' : placeOf(scene) === 'dock' ? '（出診）' : '');
