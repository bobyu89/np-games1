// 進度帶著走：匯出一份、到另一台匯入。登入同步（account.ts）在雲端存的也是同一種格式。
// 匯出的是一段文字（可以存成檔案，也可以直接複製貼上）。裡面只有代號和分數：
// 線索的文字不放進去，匯入的時候從病例檔補回來，所以內容短、病例改了字也不會帶到舊的。
import type { CaseDef, Safety, Session } from '../core/types.ts';
import type { CaseRecord, Run, Save, TrialRecord } from './store.ts';

const SAFETY: Safety[] = ['met', 'late', 'review'];
/** 一個病例：最佳分數、安全行動、玩過幾次、花了幾秒、診斷對了沒、回應在意的事、解讀對的線索 */
type Row = [number, number, number, number, 0 | 1, 0 | 1, string[]];
/** 一場資格試煉：什麼時候、哪一位病人、分數、安全行動、花了幾秒、是不是時間到、診斷對了沒 */
type TrialRow = [number, string, number, number, number, 0 | 1, 0 | 1];
/** 第 4 版多了 trials。第 3 版的照樣讀得進來；比這一版新的不讀（請玩家先更新遊戲） */
interface Packed { app: 'mist-guild'; kind: 'save'; v: 3 | 4; at: string; build: string; hero: string | null; beats: string[]; takeaways: string[]; cases: Record<string, Row>; trials?: TrialRow[] }
const VERSION = 4, TRIALS_KEPT = 30;

export function packSave(save: Save, build: string, now = new Date()): string {
  const cases: Record<string, Row> = {};
  for (const [id, r] of Object.entries(save.cases)) cases[id] = [r.best, SAFETY.indexOf(r.safety), r.plays, r.seconds, r.found ? 1 : 0, r.concern ? 1 : 0, r.reads.map((k) => k.clue)];
  const trials: TrialRow[] = save.trials.slice(0, TRIALS_KEPT).map((t) => [t.at, t.caseId, t.score, SAFETY.indexOf(t.safety), t.seconds, t.timeUp ? 1 : 0, t.found ? 1 : 0]);
  const out: Packed = { app: 'mist-guild', kind: 'save', v: VERSION, at: now.toISOString(), build, hero: save.hero, beats: save.beats, takeaways: save.takeaways, cases, trials };
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
  if (typeof raw.v !== 'number' || raw.v > VERSION) return { ok: false, why: '這份進度是比較新的版本存的。請先把遊戲更新到新版，再匯入。' };
  if (raw.v < 3) return { ok: false, why: '這份進度是舊版的格式，現在讀不了。' };
  const out: Record<string, CaseRecord> = {};
  let dropped = 0;
  for (const [id, row] of Object.entries(raw.cases && typeof raw.cases === 'object' ? raw.cases : {})) {
    const c = cases.find((k) => k.id === id);
    if (!c || !Array.isArray(row)) { dropped++; continue; }
    const reads = strings(row[6], 200, 80).flatMap((clue) => { const k = c.clues.find((x) => x.id === clue); return k?.tell ? [{ clue, text: k.text, form: k.tell.form, dir: k.tell.dir }] : []; });
    out[id] = { best: int(row[0], 0, 100), safety: SAFETY[int(row[1], 0, 2)], plays: int(row[2], 1, 9999), seconds: int(row[3], 0, 86_400), found: row[4] === 1, concern: row[5] === 1, reads };
  }
  const trials: TrialRecord[] = (Array.isArray(raw.trials) ? raw.trials : []).flatMap((row) => (Array.isArray(row) && typeof row[1] === 'string' && cases.some((k) => k.id === row[1]) && typeof row[0] === 'number' && row[0] > 0
    ? [{ at: Math.round(row[0]), caseId: row[1], score: int(row[2], 0, 100), safety: SAFETY[int(row[3], 0, 2)], seconds: int(row[4], 0, 86_400), timeUp: row[5] === 1, found: row[6] === 1 }] : [])).slice(0, TRIALS_KEPT);
  const save: Save = { v: 3, beats: strings(raw.beats, 200, 60), cases: out, takeaways: strings(raw.takeaways, 5, 300), hero: typeof raw.hero === 'string' && raw.hero.length <= 40 ? raw.hero : null, trials };
  return { ok: true, save, at: typeof raw.at === 'string' && !Number.isNaN(Date.parse(raw.at)) ? raw.at : null, dropped };
}

/** 兩份進度併成一份（這一台的、雲端的）。進度只會往前：每個病例留比較好的那一次，解讀對的線索、看過的故事兩邊加起來。
 *  所以不管哪一台先同步、同步幾次，結果都一樣，也不會把另一台的進度蓋掉。 */
export function mergeSaves(mine: Save, theirs: Save): Save {
  const cases: Record<string, CaseRecord> = { ...theirs.cases };
  for (const [id, x] of Object.entries(mine.cases)) {
    const y = theirs.cases[id];
    if (!y) { cases[id] = x; continue; }
    const top = x.best >= y.best ? x : y, reads = [...x.reads];   // 分數一樣的時候用這一台的
    y.reads.forEach((r) => { if (!reads.some((k) => k.clue === r.clue)) reads.push(r); });
    cases[id] = { best: top.best, safety: top.safety, seconds: top.seconds, plays: Math.max(x.plays, y.plays), found: x.found || y.found, concern: x.concern || y.concern, reads };
  }
  // 試煉的紀錄：兩邊加起來，同一場只留一筆，新的在前面
  const seen = new Set<string>(), trials = [...mine.trials, ...theirs.trials].filter((t) => { const k = t.at + ':' + t.caseId; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.at - a.at).slice(0, TRIALS_KEPT);
  return { v: 3, hero: mine.hero ?? theirs.hero, beats: [...new Set([...mine.beats, ...theirs.beats])], takeaways: [...new Set([...mine.takeaways, ...theirs.takeaways])].slice(0, 5), cases, trials };
}
/** 兩份進度的內容是不是一樣（不管裡面的順序） */
export function sameSave(a: Save, b: Save): boolean {
  const flat = (s: Save) => JSON.stringify([s.hero, [...s.beats].sort(), s.takeaways, Object.keys(s.cases).sort().map((id) => { const r = s.cases[id]; return [id, r.best, r.safety, r.plays, r.seconds, r.found, r.concern, r.reads.map((k) => k.clue).sort()]; }),
    s.trials.map((t) => [t.at, t.caseId, t.score]).sort()]);
  return flat(a) === flat(b);
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
