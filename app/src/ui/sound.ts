// 聲音：程式合成的，偏木頭和鈴鐺的音色，不需要音檔。
let audio: AudioContext | null = null;
export const sound = { on: true };

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.05, when = 0, slide = 0) {
  if (!sound.on) return;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audio = audio || new Ctor();
    if (audio.state === 'suspended') void audio.resume();
    const t0 = audio.currentTime + when, o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(audio.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  } catch { /* 沒有聲音也能玩 */ }
}

export const sfx = {
  tap: () => tone(420, 0.07, 'triangle', 0.06, 0, -160),
  type: () => tone(620 + Math.random() * 90, 0.025, 'triangle', 0.014),
  clue: () => { tone(587, 0.22, 'sine', 0.07); tone(880, 0.3, 'sine', 0.06, 0.1); },
  key: () => { [587, 740, 880, 1175].forEach((f, i) => tone(f, 0.3, 'sine', 0.055, i * 0.09)); },
  bell: () => { tone(392, 1.1, 'triangle', 0.12); tone(784, 0.8, 'sine', 0.06); tone(1176, 0.5, 'sine', 0.03); tone(392, 1.1, 'triangle', 0.1, 0.55); },
  alarm: () => { tone(196, 0.3, 'triangle', 0.1, 0, -40); tone(174, 0.4, 'triangle', 0.1, 0.28, -40); },
  miss: () => tone(150, 0.14, 'triangle', 0.06, 0, -40),
  page: () => { tone(300, 0.09, 'triangle', 0.04, 0, 200); },
  done: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'sine', 0.06, i * 0.12)); },
};
export const buzz = (ms: number | number[]) => { try { navigator.vibrate?.(ms); } catch { /* 不支援就算了 */ } };
export const still = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
