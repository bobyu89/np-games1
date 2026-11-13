// 圖鑑裡的小圖。不另外畫：直接用真正的場景，只看其中一塊，而且不會動。
// 所以場景或人物的畫改了，圖鑑的圖會跟著變。
import { useEffect, useRef } from 'react';
import { createWard } from '../art/ward.js';
import { createHall } from '../art/hall.js';

/** 要看哪個場景的哪一塊。view 是場景座標裡的一個框（寬、高、中心）；沒寫就是整個場景 */
export interface Shot {
  kind: 'ward' | 'hall';
  patient?: string;
  scene?: string;
  hero?: string;
  /** 值班醫師在場 */
  doctor?: boolean;
  /** 燈塔的燈亮著（只有燈塔那一間看得出來） */
  lit?: boolean;
  view?: { w: number; h: number; cx: number; cy: number };
}
interface Still { state: Record<string, unknown>; resize(w: number, h: number): void; update(t: number, dt: number): void; render(): void }

export function Portrait({ shot, label, locked, wide }: { shot: Shot; label: string; locked?: boolean; wide?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null), key = JSON.stringify(shot);
  useEffect(() => {
    const el = ref.current!;
    const s = (shot.kind === 'ward' ? createWard(el, { patient: shot.patient, scene: shot.scene, hero: shot.hero, view: shot.view }) : createHall(el, { hero: shot.hero, view: shot.view })) as unknown as Still;
    s.state.still = true; s.state.hide = true; s.state.glow = 0; s.state.doctor = shot.doctor ? 1 : 0; s.state.beam = shot.lit ? 1 : 0;
    const draw = () => { if (!el.clientWidth) return; s.resize(el.clientWidth, el.clientHeight); s.update(0, 1); s.render(); };
    draw();
    const ro = new ResizeObserver(draw); ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return <canvas ref={ref} className={'portrait' + (wide ? ' wide' : '') + (locked ? ' locked' : '')} role="img" aria-label={locked ? '還沒看過' : label} />;
}
