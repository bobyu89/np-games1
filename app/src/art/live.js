// 會動的畫面的插圖：背景一張（空房間），每個角色一張去背的圖、同一個姿勢兩三種表情，由程式疊起來、讓人呼吸、說話、點頭。
// 霧、燈、星星、鐘聲還是程式畫。素材清單在 live-manifest.js（app/tools/art.py live 產生）；
// 一個場景要的圖沒有全部到齊，就整個照舊用程式畫，不會新舊混在一起。
import MANIFEST from './live-manifest.js';

const SPRITES = MANIFEST.sprites || {};
const cache = new Map();

/** 這幾張圖是不是都有 */
export function hasLive(ids) { return ids.length > 0 && ids.every((id) => !!SPRITES[id]); }

function load(id) {
  if (!cache.has(id)) {
    cache.set(id, new Promise((ok, bad) => {
      const img = new Image();
      img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => ok(img));
      img.onerror = () => { cache.delete(id); bad(new Error('插圖載入失敗：' + id)); };
      img.src = SPRITES[id].src;
    }));
  }
  return cache.get(id);
}

/** 開始載入一組圖。回傳的物件先給場景用（ready 是 false 的時候場景先畫空白），載完了 ready 變 true；
 *  有一張載不到，failed 變 true，場景改回程式畫 */
export function liveFor(ids) {
  if (!hasLive(ids)) return null;
  const L = { ready: false, failed: false, meta: Object.fromEntries(ids.map((id) => [id, SPRITES[id]])), img: {}, then: null };
  L.then = Promise.all(ids.map(load)).then((imgs) => { ids.forEach((id, i) => { L.img[id] = imgs[i]; }); L.ready = true; }, () => { L.failed = true; });
  return L;
}

/** 一張圖在場景座標裡的大小：manifest 寫 width 或 height（場景單位），另一邊照比例 */
export function sizeOf(meta, img) {
  const w = img.naturalWidth, h = img.naturalHeight;
  const s = meta.width ? meta.width / w : (meta.height || 120) / h;
  return { s, w: w * s, h: h * s };
}

/** 把一張去背的圖畫在 (x, y)：(x, y) 對到圖上的 foot（像素，預設是底部中間）。
 *  o：sx、sy 縮放（呼吸用）、rot 旋轉、alpha、dx/dy 位移 */
export function drawSprite(g, img, meta, x, y, o = {}) {
  if (!img) return;
  const { s } = sizeOf(meta, img), [fx, fy] = meta.foot || [img.naturalWidth / 2, img.naturalHeight];
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  g.save();
  g.globalAlpha *= Math.min(1, a);
  g.translate(x + (o.dx || 0), y + (o.dy || 0));
  if (o.rot) g.rotate(o.rot);
  g.scale(s * (o.sx ?? 1), s * (o.sy ?? 1));
  g.drawImage(img, -fx, -fy);
  g.restore();
}

/** 頭頂在場景座標的位置（對話泡泡用）：manifest 的 head（像素），沒寫就是圖的上緣中間 */
export function headOf(meta, img, x, y) {
  const { s } = sizeOf(meta, img), [fx, fy] = meta.foot || [img.naturalWidth / 2, img.naturalHeight], [hx, hy] = meta.head || [img.naturalWidth / 2, 0];
  return [x + (hx - fx) * s, y + (hy - fy) * s];
}
