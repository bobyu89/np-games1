// 規則核心：給一個病例、一場對局和一個行動，算出新的對局和「發生了什麼」。
// 沒有亂數、不看真實時間、不碰畫面。同樣的行動順序一定得到同樣的結果。
import type { Action, Board, CaseDef, GameEvent, Session, Vitals } from './types.ts';

/** 每種行動花掉的模擬時間（秒）。看字和排推理板不扣時間 */
export const COST = { ask: 30, vitals: 40, exam: 30, explainExam: 10, watch: 30, call: 5, report: 30, explain: 40 } as const;

export const emptyBoard = (): Board => ({ summary: null, likely: null, exclude: [], support: [], against: [] });

export function createSession(c: CaseDef): Session {
  return {
    caseId: c.id, mode: 'quest', time: 0,
    asked: [], examined: [], ordered: [], results: [], clues: [],
    vitalsSeen: null, vitalsLog: [],
    worsenedAt: null, calledAt: null, calledBy: null, doctorAt: null, doctorHere: false,
    report: null, ecgRead: false, board: emptyBoard(), explained: null, hints: 0, closedAt: null, log: [],
  };
}

/** 病人此刻真正的生命徵象。玩家要量了才看得到 */
export function trueVitals(c: CaseDef, s: Session): Vitals {
  return s.worsenedAt !== null ? c.vitals.worse : c.vitals.base;
}

/** 穩定度：只在委託裡顯示。由時間和安全行動推動，不是問對問題就回血 */
export function stability(_c: CaseDef, s: Session): number {
  const untilHelp = s.calledAt ?? s.time;
  let v = 66 - Math.floor(untilHelp / 20);
  if (s.worsenedAt !== null) v -= 22;
  if (s.calledBy === 'you') v += 6;
  if (s.doctorHere) v += 8;
  if (s.report) v += 6;
  if (s.ecgRead) v += 6;
  return Math.max(6, Math.min(100, v));
}

const fogOf = (c: CaseDef, id: string) => { const k = c.clues.find((x) => x.id === id); return k ? k.fog ?? (k.key ? 3 : 1) : 0; };
/** 霧還剩多少（0 到 1）。拿到七成的線索份量就算全散 */
export function veil(c: CaseDef, s: Session): number {
  if (s.closedAt !== null) return 0;
  const total = c.clues.reduce((n, k) => n + fogOf(c, k.id), 0) * 0.7;
  const got = s.clues.reduce((n, id) => n + fogOf(c, id), 0);
  return Math.max(0, Math.min(1, 1 - got / total));
}

export const isKey = (c: CaseDef, clueId: string) => !!c.clues.find((k) => k.id === clueId)?.key;
export const testReady = (s: Session, id: string) => s.results.includes(id);

/** 岑禾現在會給的提示。依對局的狀況挑一句，不直接講答案 */
export function hintFor(c: CaseDef, s: Session): string {
  const h = (id: string) => c.hints.find((x) => x.id === id)!.text;
  const ecg = c.timeline.ecgTest;
  if (s.calledAt === null && s.vitalsSeen === null && s.asked.length < 2) return h('h-vitals');
  if (s.calledAt === null) return h('h-call');
  if (!s.ordered.some((o) => o.id === ecg)) return h('h-ecg');
  if (s.worsenedAt !== null && !s.vitalsLog.some((t) => t >= s.worsenedAt!)) return h('h-reassess');
  if (!s.report) return h('h-report');
  const hasNeg = s.clues.some((id) => ['c-notear', 'c-noimmob', 'c-botharms'].includes(id));
  if (!hasNeg) return h('h-negatives');
  if (!s.board.likely) return h('h-board');
  if (!s.explained) return h('h-explain');
  return h('h-close');
}

interface Ctx { c: CaseDef; s: Session; ev: GameEvent[] }

function addClue(x: Ctx, id: string | undefined, type: string, src: string) {
  if (!id || x.s.clues.includes(id)) return;
  x.s.clues = [...x.s.clues, id];
  x.s.log = [...x.s.log, { t: x.s.time, type: 'clue', id: src, clue: id, note: type }];
  x.ev.push({ type: 'clue', id, key: isKey(x.c, id) });
}
const note = (x: Ctx, type: string, id?: string, n?: string) => { x.s.log = [...x.s.log, { t: x.s.time, type, id, note: n }]; };

/** 時間走過之後，檢查劇本上的事件有沒有到 */
function advance(x: Ctx) {
  const { c, s, ev } = x, tl = c.timeline;
  // 檢查結果回來
  for (const o of s.ordered) {
    const def = c.tests.find((t) => t.id === o.id)!;
    if (def.delay === undefined || s.results.includes(o.id) || s.time < o.at + def.delay) continue;
    s.results = [...s.results, o.id];
    note(x, 'result', o.id);
    ev.push({ type: 'result', id: o.id }, { type: 'toast', text: def.label + '的結果回來了' });
    addClue(x, def.clue, 'test', o.id);
  }
  // 還沒通報就拖過時間：病況變差
  if (s.worsenedAt === null && s.calledAt === null && s.time >= tl.worsenAt) {
    s.worsenedAt = s.time;
    note(x, 'worsen');
    ev.push({ type: 'worsen' }, { type: 'say', who: 'patient', text: c.lines.worsen }, { type: 'say', who: 'sys', text: '病人的狀況變了。現在通報還來得及。', bad: true });
  }
  // 再拖下去：岑禾接手敲鐘
  if (s.calledAt === null && s.time >= tl.stepInAt) {
    s.calledAt = s.time; s.calledBy = 'mentor'; s.doctorAt = s.time + tl.doctorDelay;
    note(x, 'call', 'mentor');
    ev.push({ type: 'bell', by: 'mentor' }, { type: 'say', who: 'mentor', text: c.lines.stepIn });
  }
  // 值班醫師趕到
  if (!s.doctorHere && s.doctorAt !== null && s.time >= s.doctorAt) {
    s.doctorHere = true;
    note(x, 'doctor');
    ev.push({ type: 'doctor' }, { type: 'say', who: 'doctor', text: s.report ? '我到了。' : c.lines.doctorArrives });
  }
  // 醫師在場、聽過回報、心電圖也回來了：由他判讀
  if (!s.ecgRead && s.doctorHere && s.report && s.results.includes(tl.ecgTest)) {
    s.ecgRead = true;
    note(x, 'ecgRead');
    ev.push({ type: 'say', who: 'doctor', text: c.lines.ecgRead });
  }
}

/** 做一個行動。回傳新的對局（原本的不會被改）和事件 */
export function perform(c: CaseDef, prev: Session, a: Action): { session: Session; events: GameEvent[] } {
  const s: Session = { ...prev };
  const x: Ctx = { c, s, ev: [] };
  const reject = (text: string) => ({ session: prev, events: [{ type: 'reject', text } as GameEvent] });
  if (prev.closedAt !== null) return reject('這張委託已經結案了。');

  switch (a.type) {
    case 'ask': {
      const q = c.questions.find((k) => k.id === a.id);
      if (!q) return reject('沒有這個問題。');
      const again = s.asked.includes(q.id);
      s.time += COST.ask;
      if (!again) s.asked = [...s.asked, q.id];
      note(x, 'ask', q.id, again ? 'again' : undefined);
      x.ev.push({ type: 'say', who: 'you', text: q.ask }, { type: 'say', who: 'patient', text: q.answer });
      addClue(x, q.clue, 'ask', q.id);
      break;
    }
    case 'vitals': {
      s.time += COST.vitals;
      const v = trueVitals(c, s), changed = !!s.vitalsSeen && s.vitalsSeen.v.bp !== v.bp;
      s.vitalsSeen = { at: s.time, v }; s.vitalsLog = [...s.vitalsLog, s.time];
      note(x, 'vitals', undefined, v.bp);
      x.ev.push({ type: 'vitals', v, changed });
      if (changed) x.ev.push({ type: 'toast', text: '血壓降到 ' + v.bp + ' mmHg', bad: true });
      addClue(x, 'c-vitals', 'vitals', 'vitals');
      break;
    }
    case 'exam': {
      const e = c.exams.find((k) => k.id === a.id);
      if (!e) return reject('沒有這個評估項目。');
      const again = s.examined.some((k) => k.id === e.id);
      s.time += COST.exam + (a.explain ? COST.explainExam : 0);
      if (!again) s.examined = [...s.examined, { id: e.id, explained: a.explain }];
      note(x, 'exam', e.id, a.explain ? 'explained' : 'silent');
      if (a.explain) x.ev.push({ type: 'say', who: 'you', text: e.explain });
      x.ev.push({ type: 'say', who: 'sys', text: e.label + '：' + e.finding });
      addClue(x, e.clue, 'exam', e.id);
      break;
    }
    case 'watch': {
      s.time += COST.watch;
      note(x, 'watch');
      x.ev.push({ type: 'say', who: 'sys', text: s.worsenedAt !== null ? '林秋閉著眼睛，呼吸又淺又快。' : '林秋按著胸口，額頭的汗一直沒有停。' });
      break;
    }
    case 'test': {
      const t = c.tests.find((k) => k.id === a.id);
      if (!t) return reject('沒有這項檢查。');
      if (t.kind === 'record') {
        s.time += t.cost;
        note(x, 'record', t.id);
        x.ev.push({ type: 'say', who: 'sys', text: t.label + '：' + t.result });
        addClue(x, t.clue, 'record', t.id);
      } else {
        if (s.ordered.some((o) => o.id === t.id)) return reject(testReady(s, t.id) ? t.label + '：' + t.result : t.label + '已經提出了，還在等結果。');
        s.time += t.cost;
        s.ordered = [...s.ordered, { id: t.id, at: s.time }];
        note(x, 'order', t.id);
        x.ev.push({ type: 'say', who: 'sys', text: t.delay === undefined ? t.label + '：' + t.pending : '已提出' + t.label + '。大約 ' + Math.round(t.delay / 60) + ' 分鐘後有結果。' });
      }
      break;
    }
    case 'board': {
      s.board = { ...a.board, exclude: [...a.board.exclude], support: [...a.board.support], against: [...a.board.against] };
      note(x, 'board', a.board.likely ?? undefined);
      x.ev.push({ type: 'toast', text: '推理板已更新' });
      break;
    }
    case 'call': {
      if (s.calledAt !== null) return reject('值班鐘已經響過了。');
      s.time += COST.call;
      s.calledAt = s.time; s.calledBy = 'you'; s.doctorAt = s.time + c.timeline.doctorDelay;
      note(x, 'call', 'you');
      x.ev.push({ type: 'bell', by: 'you' }, { type: 'say', who: 'mentor', text: c.lines.called });
      break;
    }
    case 'report': {
      if (s.calledAt === null) return reject('還沒有人知道這裡需要幫忙。先敲值班鐘。');
      if (s.report) return reject('已經回報過了。');
      const as = c.sbar.assessments.find((k) => k.id === a.a);
      if (!as) return reject('回報裡少了你的評估。');
      s.time += COST.report;
      s.report = { at: s.time, a: a.a, r: a.r.filter((id) => c.sbar.requests.some((k) => k.id === id)) };
      note(x, 'report', a.a);
      const asked = s.report.r.filter((id) => c.sbar.requests.find((k) => k.id === id)!.ok).length;
      const bad = s.report.r.some((id) => !c.sbar.requests.find((k) => k.id === id)!.ok);
      const good = as.score >= 2 && asked >= 2 && !bad;
      x.ev.push({ type: 'say', who: 'doctor', text: good ? c.lines.reportGood : c.lines.reportWeak });
      // 回報裡要求了心電圖，就等於提出
      if (s.report.r.includes('r-ecg') && !s.ordered.some((o) => o.id === c.timeline.ecgTest)) {
        s.ordered = [...s.ordered, { id: c.timeline.ecgTest, at: s.time }];
        note(x, 'order', c.timeline.ecgTest, 'via-report');
      }
      break;
    }
    case 'explain': {
      if (s.explained) return reject('已經向林秋說明過了。');
      const ids = a.ids.filter((id) => { const e = c.explain.find((k) => k.id === id); return e && (!e.needsClue || s.clues.includes(e.needsClue)); });
      if (!ids.length) return reject('還沒有選要說的話。');
      s.time += COST.explain;
      s.explained = ids;
      note(x, 'explain', ids.join(','));
      ids.forEach((id) => x.ev.push({ type: 'say', who: 'you', text: c.explain.find((k) => k.id === id)!.text }));
      const ok = ids.every((id) => c.explain.find((k) => k.id === id)!.ok);
      x.ev.push({ type: 'say', who: 'patient', text: ok ? (ids.includes('e-concern') ? '……好。麻煩你們跟她說一聲，我就放心了。' : '……好，我知道了。') : '是嗎……那我是不是可以回去了？' });
      break;
    }
    case 'hint': {
      s.hints += 1;
      note(x, 'hint');
      x.ev.push({ type: 'say', who: 'mentor', text: hintFor(c, s) });
      break;
    }
    case 'close': {
      note(x, 'close');
      s.closedAt = s.time;
      x.ev.push({ type: 'closed' }, { type: 'say', who: 'mentor', text: c.lines.closing });
      return { session: s, events: x.ev };
    }
  }
  advance(x);
  return { session: s, events: x.ev };
}

/** 把一串行動從頭跑一遍。回放和測試都用這個 */
export function replay(c: CaseDef, actions: Action[]): Session {
  return actions.reduce((s, a) => perform(c, s, a).session, createSession(c));
}
