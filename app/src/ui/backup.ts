// 進度帶著走：靜態版沒有帳號，換裝置靠「匯出一份、到另一台匯入」。
// 匯出的是一段文字（可以存成檔案，也可以直接複製貼上）。裡面只有代號和分數：
// 線索的文字不放進去，匯入的時候從病例檔補回來，所以內容短、病例改了字也不會帶到舊的。
import type { CaseDef, Safety, Session } from '../core/types.ts';
import type { CaseRecord, Run, Save } from './store.ts';

const SAFETY: Safety[] = ['met', 'late', 'review'];
/** 一個病例：最佳分數、安全行動、玩過幾次、花了幾秒、認出真身、回應在意的事、解讀對的線索 */
type Row = [number, number, number, number, 0 | 1, 0 | 1, string[]];
interface Packed { app: 'mist-guild'; kind: 'save'; v: 3; at: string; build: string; hero: string | null; beats: string[]; takeaways: string[]; cases: Record<string, Row> }

export function packSave(save: Save, build: string, now = new Date()): string {
  const cases: Record<string, Row> = {};
  for (const [id, r] of Object.entries(save.cases)) cases[id] = [r.best, SAFETY.indexOf(r.safety), r.plays, r.seconds, r.found ? 1 : 0, r.concern ? 1 : 0, r.reads.map((k) => k.clue)];
  const out: Packed = { app: 'mist-guild', kind: 'save', v: 3, at: now.toISOString(), build, hero: save.hero, beats: save.beats, takeaways: save.takeaways, cases };
  return JSON.stringify(out);
}

const strings = (x: unknown, max: number, len: number) => (Array.isArray(x) ? [...new Set(x.filter((k): k is string => typeof k === 'string' && k.length > 0 && k.length <= len))].slice(0, max) : []);
const int = (x: unknown, lo: number, hi: number) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(lo, Math.min(hi, Math.round(x))) : lo);

export type Read = { ok: true; save: Save; at: string | null; dropped: number } | { ok: false; why: string };

/** 讀一份匯出的進度。看不懂的、這一版沒有的病例和線索會略過（dropped 是略過幾個病例） */
export function readBackup(text: string, cases: CaseDef[]): Read {
  if (text.length > 400_000) return { ok: false, why: '這份內容太長，不像是進度。' };
  let raw: Partial<Packed>;
  try { raw = JSON.parse(text.trim()) as Partial<Packed>; } catch { return { ok: false, why: '讀不懂這份內容。請確認是從「匯出進度」拿到的，而且整段都貼上了。' }; }
  if (!raw || typeof raw !== 'object' || raw.app !== 'mist-guild' || raw.kind !== 'save') return { ok: false, why: '這不是霧脈公會的進度。' };
  if (typeof raw.v !== 'number' || raw.v > 3) return { ok: false, why: '這份進度是比較新的版本存的。請先把遊戲更新到新版，再匯入。' };
  if (raw.v < 3) return { ok: false, why: '這份進度是舊版的格式，現在讀不了。' };
  const out: Record<string, CaseRecord> = {};
  let dropped = 0;
  for (const [id, row] of Object.entries(raw.cases && typeof raw.cases === 'object' ? raw.cases : {})) {
    const c = cases.find((k) => k.id === id);
    if (!c || !Array.isArray(row)) { dropped++; continue; }
    const reads = strings(row[6], 200, 80).flatMap((clue) => { const k = c.clues.find((x) => x.id === clue); return k?.tell ? [{ clue, text: k.text, form: k.tell.form, dir: k.tell.dir }] : []; });
    out[id] = { best: int(row[0], 0, 100), safety: SAFETY[int(row[1], 0, 2)], plays: int(row[2], 1, 9999), seconds: int(row[3], 0, 86_400), found: row[4] === 1, concern: row[5] === 1, reads };
  }
  const save: Save = { v: 3, beats: strings(raw.beats, 200, 60), cases: out, takeaways: strings(raw.takeaways, 5, 300), hero: typeof raw.hero === 'string' && raw.hero.length <= 40 ? raw.hero : null };
  return { ok: true, save, at: typeof raw.at === 'string' && !Number.isNaN(Date.parse(raw.at)) ? raw.at : null, dropped };
}

/** 存下來的那一場還能不能接著做：病例還在，而且裡面提到的題目、評估、檢查、線索這一版都還有 */
export function validRun(c: CaseDef | undefined, run: Run | null): run is Run {
  if (!c || !run || run.caseId !== c.id) return false;
  const s = run.session as Partial<Session> | null;
  if (!s || s.caseId !== c.id || typeof s.time !== 'number' || ![1, 2, 3, 4].includes(s.phase as number) || !s.board || !Array.isArray(s.board.exclude)) return false;
  const lists = [s.asked, s.examined, s.ordered, s.results, s.clues, s.pending, s.reads, s.commits, s.vitalsLog, s.log];
  if (lists.some((l) => !Array.isArray(l))) return false;
  const has = (ids: string[], pool: { id: string }[]) => ids.every((id) => pool.some((k) => k.id === id));
  return has(s.asked!, c.questions) && has(s.examined!.map((k) => k.id), c.exams) && has(s.ordered!.map((k) => k.id), c.tests) && has(s.results!, c.tests)
    && has([...s.clues!, ...s.pending!, ...s.reads!.map((k) => k.clue)], c.clues) && has([s.board.likely, ...s.board.exclude].filter((k): k is string => !!k), c.forms);
}
