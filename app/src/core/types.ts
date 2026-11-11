// 病例格式（第 2 版）和一場對局的狀態。
// 規則核心只用這些型別，不碰畫面，之後可以原封不動搬到伺服器。

export interface Vitals { bp: string; hr: number; rr: number; spo2: number; bt: number }

/** 一條線索：問到的、看到的、量到的事實 */
export interface Clue {
  id: string;
  text: string;
  /** pos：有的症狀或異常；neg：病人否認的、檢查正常的；info：背景資料 */
  kind: 'pos' | 'neg' | 'info';
  key?: boolean;
  /** 這條線索能推開多少霧。沒寫的話，關鍵線索 3，其他 1 */
  fog?: number;
}

export type QuestionGroup = 'open' | 'cc' | 'hx' | 'ros';
export interface Question {
  id: string;
  group: QuestionGroup;
  /** 按鈕上的短字 */
  label: string;
  /** 玩家說出口的完整問法 */
  ask: string;
  answer: string;
  clue?: string;
  weight: number;
}

export interface Exam {
  id: string;
  label: string;
  /** 動手之前對病人說的話：目的、項目、部位 */
  explain: string;
  finding: string;
  clue?: string;
  weight: number;
}

export interface TestDef {
  id: string;
  label: string;
  /** record：已經有的資料；order：提出要做的檢查 */
  kind: 'record' | 'order';
  cost: number;
  /** 提出之後多久有結果（模擬的秒數）。沒寫表示這一關裡等不到結果 */
  delay?: number;
  result?: string;
  pending?: string;
  clue?: string;
}

export interface Hypothesis {
  id: string;
  name: string;
  /** 支持這個假設的線索 */
  support: string[];
  /** 讓這個假設比較不像的線索 */
  against: string[];
}

export interface Choice { id: string; text: string; note: string }

export interface CaseDef {
  format: 2;
  id: string;
  title: string;
  complaint: string;
  review: { state: '未審查' | '已審查'; note: string };
  patient: { name: string; age: number; sex: string; job: string };
  shadow: { name: string; lore: string };
  reading: { lines: string[]; prompts: string[] };
  vitals: { base: Vitals; worse: Vitals };
  clues: Clue[];
  questions: Question[];
  exams: Exam[];
  tests: TestDef[];
  hypotheses: Hypothesis[];
  answer: { likely: string; exclude: Record<string, number> };
  summaries: (Choice & { score: number })[];
  sbar: {
    assessments: (Choice & { score: number })[];
    requests: (Choice & { ok: boolean })[];
  };
  explain: (Choice & { ok: boolean; needsClue?: string; concern?: boolean })[];
  /** 劇本上的時間點（模擬的秒數） */
  timeline: { worsenAt: number; stepInAt: number; ecgBy: number; ecgTest: string; doctorDelay: number };
  lines: {
    opening: string[];
    worsen: string;
    stepIn: string;
    called: string;
    doctorArrives: string;
    reportGood: string;
    reportWeak: string;
    ecgRead: string;
    closing: string;
    hintNoExplain: string;
  };
  hints: { id: string; text: string }[];
  debrief: {
    alternatives: string[];
    teaching: { text: string; ref: string }[];
    references: { id: string; text: string; doi: string }[];
  };
}

export interface Board {
  summary: string | null;
  likely: string | null;
  exclude: string[];
  support: string[];
  against: string[];
}

export interface LogEntry { t: number; type: string; id?: string; note?: string; clue?: string }

export interface Session {
  caseId: string;
  mode: 'quest';
  /** 模擬的時鐘，單位是秒。只有做行動才會走 */
  time: number;
  asked: string[];
  examined: { id: string; explained: boolean }[];
  ordered: { id: string; at: number }[];
  /** 結果已經回來的檢查 */
  results: string[];
  clues: string[];
  /** 最後一次量到的生命徵象。沒量過是 null：不知道的就是不知道 */
  vitalsSeen: { at: number; v: Vitals } | null;
  vitalsLog: number[];
  worsenedAt: number | null;
  calledAt: number | null;
  calledBy: 'you' | 'mentor' | null;
  doctorAt: number | null;
  doctorHere: boolean;
  report: { at: number; a: string; r: string[] } | null;
  ecgRead: boolean;
  board: Board;
  explained: string[] | null;
  hints: number;
  closedAt: number | null;
  log: LogEntry[];
}

export type Action =
  | { type: 'ask'; id: string }
  | { type: 'vitals' }
  | { type: 'exam'; id: string; explain: boolean }
  | { type: 'watch' }
  | { type: 'test'; id: string }
  | { type: 'board'; board: Board }
  | { type: 'call' }
  | { type: 'report'; a: string; r: string[] }
  | { type: 'explain'; ids: string[] }
  | { type: 'hint' }
  | { type: 'close' };

/** 規則核心告訴畫面「發生了什麼」，畫面決定怎麼演 */
export type GameEvent =
  | { type: 'say'; who: 'you' | 'patient' | 'mentor' | 'doctor' | 'sys'; text: string; bad?: boolean }
  | { type: 'clue'; id: string; key: boolean }
  | { type: 'vitals'; v: Vitals; changed: boolean }
  | { type: 'worsen' }
  | { type: 'bell'; by: 'you' | 'mentor' }
  | { type: 'doctor' }
  | { type: 'result'; id: string }
  | { type: 'toast'; text: string; bad?: boolean }
  | { type: 'reject'; text: string }
  | { type: 'closed' };

export type Safety = 'met' | 'late' | 'review';

export interface RubricRow { id: string; track: 'data' | 'reason'; name: string; got: number; max: number; notes: string[] }
export interface Score {
  rows: RubricRow[];
  data: number;
  reason: number;
  total: number;
  safety: Safety;
  safetyNote: string;
}
