// 規則核心：給一個病例、一場對局和一個行動，算出新的對局和「發生了什麼」。
// 沒有亂數、不看真實時間、不碰畫面。同樣的行動順序一定得到同樣的結果。
// 這裡不認得任何一個特定的病例：規則全部從病例的資料來。
import type { Action, Board, CaseDef, Clue, GameEvent, Session, Tell, Vitals } from './types.ts';

/** 每種行動花掉的模擬時間（秒）。看字、解讀線索、排推理板都不扣時間 */
// 問診加評估整套做完大約 15 分鐘，和考站的時間差不多
export const COST = { ask: 20, vitals: 40, exam: 20, explainExam: 10, watch: 30, call: 5, report: 30, explain: 40 } as const;
/** 解讀到第幾條線索的時候，岑禾會停下來問「你最擔心哪一個」 */
export const COMMIT_AFTER = 3;

export const emptyBoard = (): Board => ({ summary: null, likely: null, exclude: [] });

export function createSession(c: CaseDef): Session {
  return {
    caseId: c.id, mode: 'quest', time: 0, phase: 1, dxAt: null,
    asked: [], examined: [], ordered: [], results: [], clues: [], pending: [], reads: [], commits: [], needCommit: false,
    vitalsSeen: null, vitalsLog: [],
    worsenedAt: null, calledAt: null, calledBy: null, bell: false, doctorAt: null, doctorHere: false,
    report: null, testRead: false, board: emptyBoard(), explained: null, hints: 0, closedAt: null, log: [],
  };
}

export const clueOf = (c: CaseDef, id: string): Clue => c.clues.find((k) => k.id === id)!;
export const formOf = (c: CaseDef, id: string | null) => c.forms.find((f) => f.id === id);
export const isUrgent = (c: CaseDef) => c.timeline.worsenAfter !== undefined;
export const testReady = (s: Session, id: string) => s.results.includes(id);

/** 病人此刻真正的生命徵象。玩家要量了才看得到 */
export function trueVitals(c: CaseDef, s: Session): Vitals {
  return s.worsenedAt !== null && c.vitals.worse ? c.vitals.worse : c.vitals.base;
}

/** 穩定度：只在委託裡顯示。由時間和安全行動推動，不是問對問題就回血 */
export function stability(c: CaseDef, s: Session): number {
  if (!isUrgent(c)) return 88;
  // 問診和評估的時候不會掉；下了診斷之後，每拖一下就掉一點，直到有人知道
  const waited = s.dxAt === null ? 0 : Math.max(0, (s.calledAt ?? s.time) - s.dxAt);
  let v = 62 - Math.floor(waited / 8);
  if (s.worsenedAt !== null) v -= 22;
  if (s.calledBy === 'you') v += 6;
  if (s.doctorHere) v += 8;
  if (s.report) v += 6;
  if (s.testRead) v += 6;
  return Math.max(6, Math.min(100, v));
}

const fogOf = (k: Clue) => k.fog ?? (k.key ? 3 : 1);
/** 霧還剩多少（0 到 1）。要解讀的線索，解讀對了霧才全散，解讀錯只散一半 */
export function veil(c: CaseDef, s: Session): number {
  if (s.closedAt !== null) return 0;
  // 問診和評估做完整，霧大約剩一成；最後那一點要等關鍵的檢查回來才會散
  const total = c.clues.reduce((n, k) => n + fogOf(k), 0) * 0.96;
  const got = s.clues.reduce((n, id) => {
    const k = clueOf(c, id), r = s.reads.find((x) => x.clue === id);
    return n + fogOf(k) * (!k.tell ? 1 : !r ? 0 : r.ok ? 1 : 0.5);
  }, 0);
  return Math.max(0, Math.min(1, 1 - got / total));
}

/** 四盞燈的亮度：解讀過的線索，讓每個真身更像（正）或比較不像（負） */
export function lights(c: CaseDef, s: Session): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(c.forms.map((f) => [f.id, 0]));
  for (const r of s.reads) { const k = clueOf(c, r.clue); if (k.tell) out[k.tell.form] += k.tell.dir * (k.key ? 2 : 1); }
  return out;
}

const hit = (k: Clue, form: string) => [k.tell, ...(k.alsoOk ?? [])].some((t) => (t as Tell).form === form);
const vitalsAfterChange = (s: Session) => s.worsenedAt === null || s.vitalsLog.some((t) => t >= s.worsenedAt!);

/** 岑禾現在會給的提示。照現在走到哪個階段挑一句，不直接講答案 */
export function hintFor(c: CaseDef, s: Session): string {
  const who = c.patient.name, asked = (g: string) => c.questions.filter((q) => q.group === g && s.asked.includes(q.id)).length, all = (g: string) => c.questions.filter((q) => q.group === g).length;
  if (s.phase === 1) {
    if (asked('open') < all('open')) return '開場還沒做完：洗手、自我介紹和核對身分、說明流程。';
    if (asked('cc') < Math.min(6, all('cc'))) return '先把主訴問清楚：什麼時候開始、在哪裡、多久、怎麼樣的痛、什麼會加重或緩解、會不會傳到別處。';
    if (asked('hx') < 4) return '主訴之後是個人和過去的病史：慢性病、家族史、過敏、菸酒、工作和接觸史。';
    if (asked('ros') < 3) return '最後用系統回顧補一遍，看有沒有漏掉的症狀。';
    return '問得差不多了，就進到評估。之後想到還可以回來補問。';
  }
  if (s.phase === 2) {
    if (s.vitalsSeen === null) return '你還不知道' + who + '的血壓和心跳。先量生命徵象。';
    if (s.examined.length < 4) return '照模組從頭做到腳：頭頸、胸部、心臟、腹部、四肢。動手之前先說明。';
    return '評估得差不多了，就去下診斷。';
  }
  if (s.phase === 3) return '把線索排一排：一句話說出問題，最可能的是哪一個，還要排除哪幾個。';
  if (c.safety.some((r) => r.type === 'call') && s.calledAt === null) return '你下了診斷。這位病人等得了嗎？該讓誰知道？';
  for (const r of c.safety) if (r.type === 'order' && !s.ordered.some((o) => o.id === r.test)) return '依你的診斷，有一項檢查要先做：' + c.tests.find((t) => t.id === r.test)!.label + '。';
  if (!vitalsAfterChange(s)) return who + '的樣子變了。你手上的數字還是剛才的。';
  const untouched = c.forms.find((f) => f.danger && !s.reads.some((r) => clueOf(c, r.clue).tell?.form === f.id));
  if (untouched) return '「' + untouched.name + '」那盞燈還沒動過。回到問診或評估，找一條能讓它更像或比較不像的線索。';
  if (!s.report) return '把你的診斷和打算，報給值班醫師。';
  if (!s.explained) return who + '還不知道自己怎麼了。結案之前，跟' + c.patient.pronoun + '說明。';
  return '該做的都做了。可以提交摘要了。';
}

interface Ctx { c: CaseDef; s: Session; ev: GameEvent[] }

function addClue(x: Ctx, id: string | undefined, type: string, src: string) {
  if (!id || x.s.clues.includes(id)) return;
  const k = clueOf(x.c, id);
  x.s.clues = [...x.s.clues, id];
  if (k.tell) x.s.pending = [...x.s.pending, id];
  x.s.log = [...x.s.log, { t: x.s.time, type: 'clue', id: src, clue: id, note: type }];
  x.ev.push({ type: 'clue', id, key: !!k.key });
}
const note = (x: Ctx, type: string, id?: string, n?: string) => { x.s.log = [...x.s.log, { t: x.s.time, type, id, note: n }]; };
function order(x: Ctx, id: string, via?: string) {
  if (x.s.ordered.some((o) => o.id === id)) return;
  x.s.ordered = [...x.s.ordered, { id, at: x.s.time }];
  note(x, 'order', id, via);
}
function summon(x: Ctx, by: 'you' | 'mentor', via: string) {
  x.s.calledAt = x.s.time; x.s.calledBy = by; x.s.doctorAt = x.s.time + x.c.timeline.doctorDelay;
  note(x, 'call', by, via);
}

/** 時間走過之後，檢查劇本上的事件有沒有到 */
function advance(x: Ctx) {
  const { c, s, ev } = x, tl = c.timeline;
  // 檢查結果回來
  for (const o of s.ordered) {
    const def = c.tests.find((t) => t.id === o.id)!;
    if (def.delay === undefined || s.results.includes(o.id) || s.time < o.at + def.delay) continue;
    s.results = [...s.results, o.id];
    note(x, 'result', o.id);
    ev.push({ type: 'result', id: o.id }, { type: 'toast', text: def.label + '的結果回來了' }, { type: 'say', who: 'sys', text: def.label + '：' + def.result });
    addClue(x, def.clue, 'test', o.id);
  }
  // 下了診斷卻遲遲不通報：病況變差
  if (tl.worsenAfter !== undefined && s.dxAt !== null && s.worsenedAt === null && s.calledAt === null && s.time >= s.dxAt + tl.worsenAfter) {
    s.worsenedAt = s.time;
    note(x, 'worsen');
    ev.push({ type: 'worsen' }, { type: 'say', who: 'patient', text: c.lines.worsen ?? '……' }, { type: 'say', who: 'sys', text: c.patient.name + '的狀況變了。現在通報還來得及。', bad: true });
  }
  // 再拖下去：岑禾接手敲鐘
  if (tl.stepInAfter !== undefined && s.dxAt !== null && s.calledAt === null && s.time >= s.dxAt + tl.stepInAfter) {
    summon(x, 'mentor', 'step-in'); s.bell = true;
    ev.push({ type: 'bell', by: 'mentor' }, { type: 'say', who: 'mentor', text: c.lines.stepIn ?? '我先敲鐘了。' });
  }
  // 值班醫師趕到
  if (!s.doctorHere && s.doctorAt !== null && s.time >= s.doctorAt) {
    s.doctorHere = true;
    note(x, 'doctor');
    ev.push({ type: 'doctor' }, { type: 'say', who: 'doctor', text: s.report ? '我到了。' : c.lines.doctorArrives });
  }
  // 醫師在場、聽過回報、關鍵的檢查也回來了：由他判讀
  const keyTest = c.safety.find((r) => r.type === 'order');
  if (c.lines.testRead && keyTest && keyTest.type === 'order' && !s.testRead && s.doctorHere && s.report && s.results.includes(keyTest.test)) {
    s.testRead = true;
    note(x, 'testRead');
    ev.push({ type: 'say', who: 'doctor', text: c.lines.testRead });
  }
}

/** 做一個行動。回傳新的對局（原本的不會被改）和事件 */
export function perform(c: CaseDef, prev: Session, a: Action): { session: Session; events: GameEvent[] } {
  const s: Session = { ...prev };
  const x: Ctx = { c, s, ev: [] };
  const reject = (text: string) => ({ session: prev, events: [{ type: 'reject', text } as GameEvent] });
  if (prev.closedAt !== null) return reject('這張委託已經結案了。');
  // 線索拿到手要先想一下它代表什麼，才能做下一件事。解讀不扣時間
  if (a.type !== 'read' && a.type !== 'commit') {
    if (prev.pending.length) return reject('先想一下手上這條線索代表什麼。');
    if (prev.needCommit) return reject('先回答岑禾：你現在最擔心哪一個？');
  }

  // 照順序：先問診，再評估，然後診斷，最後才是檢查和處置。可以回頭補做，不能跳到後面
  if (a.type === 'exam' && prev.phase < 2) return reject('照順序來：先問診，問完了再開始評估。');
  if (a.type === 'board' && prev.phase < 3) return reject('照順序來：評估做完，再下診斷。');
  if ((a.type === 'test' || a.type === 'report' || a.type === 'explain') && prev.dxAt === null) return reject('先下診斷，再決定要做什麼檢查和處置。');

  switch (a.type) {
    case 'advance': {
      if (s.phase >= 3) return reject(s.phase === 3 ? '下了診斷，才會進到檢查。' : '已經是最後一個階段了。');
      s.phase = (s.phase + 1) as 2 | 3;
      note(x, 'advance', String(s.phase));
      x.ev.push({ type: 'say', who: 'mentor', text: s.phase === 2 ? '好，接著評估。動手之前，先讓' + c.patient.pronoun + '知道你要做什麼。' : '線索都在你手上了。下診斷吧。' });
      break;
    }
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
      if (changed) x.ev.push({ type: 'toast', text: '血壓變成 ' + v.bp + ' mmHg', bad: true });
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
      x.ev.push({ type: 'say', who: 'sys', text: s.worsenedAt !== null && c.lines.watchWorse ? c.lines.watchWorse : c.lines.watch });
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
        order(x, t.id);
        x.ev.push({ type: 'say', who: 'sys', text: t.delay === undefined ? t.label + '：' + t.pending : '已提出' + t.label + '。大約 ' + Math.round(t.delay / 60) + ' 分鐘後有結果。' });
      }
      break;
    }
    case 'read': {
      if (s.pending[0] !== a.clue) return reject('現在要想的不是這一條線索。');
      if (!formOf(c, a.form)) return reject('沒有這個真身。');
      const k = clueOf(c, a.clue), ok = hit(k, a.form);
      s.pending = s.pending.slice(1);
      s.reads = [...s.reads, { clue: a.clue, form: a.form, ok, t: s.time }];
      note(x, 'read', a.clue, ok ? 'ok' : 'miss');
      x.ev.push({ type: 'read', id: a.clue, ok }, { type: 'say', who: 'mentor', text: (ok ? '對。' : '不是這一個。') + (k.why ?? '') });
      if (!s.pending.length && s.reads.length >= COMMIT_AFTER && !s.commits.length) {
        s.needCommit = true;
        x.ev.push({ type: 'say', who: 'mentor', text: '先停一下。到目前為止，你最擔心哪一個？' });
      }
      break;
    }
    case 'commit': {
      if (!s.needCommit) return reject('岑禾現在沒有問你。');
      if (!formOf(c, a.form)) return reject('沒有這個真身。');
      s.needCommit = false;
      s.commits = [...s.commits, { t: s.time, form: a.form }];
      note(x, 'commit', a.form);
      x.ev.push({ type: 'say', who: 'mentor', text: '記下了。接下來的線索，看它支不支持你。' });
      break;
    }
    case 'board': {
      s.board = { ...a.board, exclude: a.board.exclude.filter((id) => id !== a.board.likely && !!formOf(c, id)) };
      note(x, 'board', a.board.likely ?? undefined);
      if (s.board.likely && s.dxAt === null) {
        s.dxAt = s.time; s.phase = 4;
        x.ev.push({ type: 'say', who: 'mentor', text: '診斷記下了。接下來：要做哪些檢查？要讓誰知道？' });
      } else x.ev.push({ type: 'toast', text: '診斷已更新' });
      break;
    }
    case 'call': {
      if (s.bell) return reject('值班鐘已經響過了。');
      s.time += COST.call;
      s.bell = true;
      if (s.calledAt === null) summon(x, 'you', 'bell'); else { s.doctorAt = s.doctorAt ?? s.time + c.timeline.doctorDelay; note(x, 'bell'); }
      x.ev.push({ type: 'bell', by: 'you' }, { type: 'say', who: 'mentor', text: c.lines.called });
      break;
    }
    case 'report': {
      if (s.report) return reject('已經回報過了。');
      const as = c.sbar.assessments.find((k) => k.id === a.a);
      if (!as) return reject('回報裡少了你的評估。');
      s.time += COST.report;
      s.report = { at: s.time, a: a.a, r: a.r.filter((id) => c.sbar.requests.some((k) => k.id === id)) };
      note(x, 'report', a.a);
      const picked = s.report.r.map((id) => c.sbar.requests.find((k) => k.id === id)!);
      const good = as.score >= 2 && picked.filter((k) => k.ok).length >= 2 && picked.every((k) => k.ok);
      // 急的病人：回報就等於讓人知道這裡需要幫忙
      if (isUrgent(c) && s.calledAt === null) summon(x, 'you', 'report');
      x.ev.push({ type: 'say', who: 'doctor', text: good ? c.lines.reportGood : c.lines.reportWeak });
      picked.forEach((k) => { if (k.orders) order(x, k.orders, 'via-report'); });
      break;
    }
    case 'explain': {
      if (s.explained) return reject('已經向' + c.patient.name + '說明過了。');
      const ids = a.ids.filter((id) => { const e = c.explain.find((k) => k.id === id); return e && (!e.needsClue || s.clues.includes(e.needsClue)); });
      if (!ids.length) return reject('還沒有選要說的話。');
      s.time += COST.explain;
      s.explained = ids;
      note(x, 'explain', ids.join(','));
      const said = ids.map((id) => c.explain.find((k) => k.id === id)!);
      said.forEach((e) => x.ev.push({ type: 'say', who: 'you', text: e.text }));
      x.ev.push({ type: 'say', who: 'patient', text: !said.every((e) => e.ok) ? c.lines.explainBad : said.some((e) => e.concern) ? c.lines.explainConcern : c.lines.explainOk });
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
      if (s.board.likely) s.commits = [...s.commits, { t: s.time, form: s.board.likely }];
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
