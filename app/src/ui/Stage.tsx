// 放插畫的那一格：建立場景、跟著容器改大小、每一格重畫。
import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createWard } from '../art/ward.js';
import { createHall } from '../art/hall.js';
import { still } from './sound.ts';

export interface StageHandle {
  state: Record<string, unknown>;
  resize(w: number, h: number): void;
  update(t: number, dt: number): void;
  render(): void;
  anchor(who: string): { x: number; y: number } | null;
  clue(key?: boolean): void;
  ring(): void;
  jolt(): void;
  setLights(list: { mark: string; level: number }[]): void;
}

interface Props { kind: 'ward' | 'hall'; patient?: string; scene?: string; shadow?: string; hero?: string | null; label: string; stage: RefObject<StageHandle | null>; onFrame?: (s: StageHandle) => void; children?: ReactNode }

export function Stage({ kind, patient, scene, shadow, hero, label, stage, onFrame, children }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null), frame = useRef<HTMLDivElement>(null), cb = useRef(onFrame);
  cb.current = onFrame;
  useEffect(() => {
    const el = canvas.current!, box = frame.current!;
    const s = (kind === 'ward' ? createWard(el, { patient, scene, shadow, hero }) : createHall(el, { hero })) as unknown as StageHandle;
    s.state.still = still();
    stage.current = s;
    const fit = () => s.resize(box.clientWidth, box.clientHeight);
    fit();
    const ro = new ResizeObserver(fit); ro.observe(box);
    let raf = 0, last = 0;
    const loop = (now: number) => {
      const t = now / 1000, dt = Math.min(0.05, last ? t - last : 0); last = t;
      s.update(t, dt); s.render(); cb.current?.(s);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); stage.current = null; };
  }, [kind, patient, scene, shadow, hero, stage]);
  return (
    <div className="paper scene">
      <div className="frame" ref={frame}>
        <canvas ref={canvas} role="img" aria-label={label} />
        {children}
      </div>
    </div>
  );
}
