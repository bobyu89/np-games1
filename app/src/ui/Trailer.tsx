// 前導片：第一次打開、選主角之前播一次（可以跳過），圖鑑的「公會」頁可以重看。
// 影片是 trailer/make.mjs 用 HyperFrames 做的，放在 public/trailer/；配樂是 trailer/music.mjs 合成的海浪和鐘聲。它不進離線快取（太大），
// 沒有網路、或播不了的時候，直接當作看完了，不擋住遊戲。
import { useEffect, useRef, useState } from 'react';
import { sfx, sound } from './sound.ts';

/** 看過前導片：記在 beats 裡，跟著存檔走 */
export const TRAILER_SEEN = 'trailer';

export function Trailer({ onDone }: { onDone(): void }) {
  const video = useRef<HTMLVideoElement>(null);
  // 手機直向：播直式的那一份，畫面才不會只剩中間一小條
  const tall = typeof innerHeight === 'number' && innerHeight > innerWidth * 1.2;
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 有配樂（海浪和鐘聲）。聲音關著就靜音播；瀏覽器不讓網頁自己出聲的時候，先靜音播，給一顆「開聲音」
  const [quiet, setQuiet] = useState(!sound.on);
  useEffect(() => {
    const v = video.current;
    if (!v || still) return;
    v.muted = !sound.on;
    v.play().catch(() => { v.muted = true; setQuiet(true); v.play().catch(() => { /* 連靜音都不讓自動播：留著播放鍵讓人自己按 */ }); });
  }, [still]);
  const unmute = () => { const v = video.current; if (!v) return; v.muted = false; sound.on = true; setQuiet(false); void v.play().catch(() => {}); };
  return (
    <div className="trailer" role="dialog" aria-modal="true" aria-label="前導片">
      <video ref={video} src={tall ? 'trailer/trailer-vertical.mp4' : 'trailer/trailer.mp4'} playsInline preload="auto" controls={still} onEnded={onDone} onError={onDone}
        aria-label="《歸航記：專科護理師的臨床推理之旅》的前導片。霧海群島十二座島，每一種劫影是一段海上的試煉；你是剛出師的見習專科護理師。" />
      {quiet && <button type="button" className="unmute" onClick={unmute}>開聲音</button>}
      <button type="button" className="skip" onClick={() => { sfx.page(); onDone(); }}>跳過</button>
    </div>
  );
}
