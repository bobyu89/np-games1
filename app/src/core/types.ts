// 病例格式（第 3 版）和一場對局的狀態。
// 規則核心只用這些型別，不碰畫面，之後可以原封不動搬到伺服器。

export interface Vitals { bp: string; hr: number; rr: number; spo2: number; bt: number }

/** 一條線索對某個真身的意義：dir 是 1 表示更像，-1 表示比較不像 */
export interface Tell { form: string; dir: 1 | -1 }

/** 一條線索：問到的、看到的、量到的事實 */
export interface Clue {
  id: string;
  text: string;
  /** pos：有的症狀或異常；neg：病人否認的、檢查正常的；info：背景資料 */
  kind: 'pos' | 'neg' | 'info';
  key?: boolean;
  /** 這條線索能推開多少霧。沒寫的話，關鍵線索 3，其他 1 */
  fog?: number;
  /** 有寫的線索，拿到之後要玩家自己解讀：它讓哪個真身更像或比較不像 */
  tell?: Tell;
  /** 也算對的其他解讀 */
  alsoOk?: Tell[];
  /** 岑禾的一句話：為什麼這樣解讀 */
  why?: string;
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

/** 身體評估照模組做：從頭到腳 */
export type ExamPart = '整體' | '頭頸' | '胸部' | '心臟' | '腹部' | '四肢';
export interface Exam {
  id: string;
  part: ExamPart;
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

/** 真身：同一隻症影底下可能的病。一個主訴固定四個 */
export interface TrueForm {
  id: string;
  name: string;
  /** 畫在燈籠上的一個字 */
  mark: string;
  /** 不能漏掉的危險診斷 */
  danger: boolean;
  blurb: string;
}

export interface Choice { id: string; text: string; note: string }

/** 安全行動：每個病例自己宣告哪些事一定要做到 */
export type SafetyRule =
  | { type: 'call'; points: number }                            // 病況變差之前通報
  | { type: 'order'; test: string; within: number; points: number } // 下診斷之後幾秒之內提出某項檢查
  | { type: 'exclude'; forms: string[]; points: number }        // 每個危險的真身，都要有一條讓它比較不像的線索
  | { type: 'explain'; id: string; points: number }             // 說明裡一定要有的那一句
  | { type: 'calm'; points: number };                           // 病人穩定，不需要敲值班鐘

export interface CaseDef {
  format: 3;
  id: string;
  /** 屬於哪個主訴模組 */
  complaint: string;
  complaintName: string;
  /** 示範：第一次遇到；變體：同一隻症影、不同的真身；遷移：沒看過的說法 */
  kind: '示範' | '變體' | '遷移';
  title: string;
  review: { state: '未審查' | '已審查'; note: string };
  patient: { name: string; age: number; sex: string; job: string; look: string; pronoun: string };
  /** 這張委託在哪裡進行。只給畫面用，規則不看。沒寫就是公會的病室 */
  scene?: 'ward' | 'ward-rain' | 'dock';
  shadow: { name: string; lore: string; look?: string };
  forms: TrueForm[];
  reading: { lines: string[]; prompts: string[] };
  vitals: { base: Vitals; worse?: Vitals };
  clues: Clue[];
  questions: Question[];
  exams: Exam[];
  tests: TestDef[];
  answer: { truth: string; exclude: Record<string, number> };
  summaries: (Choice & { score: number })[];
  sbar: {
    assessments: (Choice & { score: number })[];
    /** orders：選了這一句，等於提出那項檢查 */
    requests: (Choice & { ok: boolean; orders?: string })[];
  };
  explain: (Choice & { ok: boolean; needsClue?: string; concern?: boolean })[];
  /** 劇本上的時間點（模擬的秒數，從下診斷那一刻算起）。沒寫 worsenAfter 表示這個病人不會變差 */
  timeline: { worsenAfter?: number; stepInAfter?: number; doctorDelay: number };
  safety: SafetyRule[];
  /** 解讀對幾條線索，「支持和反對的證據」就拿滿 */
  readsNeeded: number;
  lines: {
    opening: string[];
    watch: string;
    watchWorse?: string;
    worsen?: string;
    stepIn?: string;
    called: string;
    doctorArrives: string;
    reportGood: string;
    reportWeak: string;
    testRead?: string;
    explainOk: string;
    explainConcern: string;
    explainBad: string;
    closing: string;
    hintNoExplain: string;
  };
  debrief: {
    alternatives: string[];
    teaching: { text: string; ref: string }[];
    references: { id: string; text: string; doi: string }[];
  };
}

export interface Board { summary: string | null; likely: string | null; exclude: string[] }

export interface LogEntry { t: number; type: string; id?: string; note?: string; clue?: string }

export interface Session {
  caseId: string;
  mode: 'quest';
  /** 提示拿掉了幾層。0：見習和巡診。1：值班（線索是更像還是比較不像要自己選；岑禾一張委託只回答三次） */
  tier: 0 | 1;
  /** 模擬的時鐘，單位是秒。只有做行動才會走 */
  time: number;
  /** 走到第幾個階段：1 問診、2 評估、3 診斷、4 檢查與處置。可以回頭補做前面的，不能跳到後面 */
  phase: 1 | 2 | 3 | 4;
  /** 第一次下診斷的時間 */
  dxAt: number | null;
  asked: string[];
  examined: { id: string; explained: boolean }[];
  ordered: { id: string; at: number }[];
  /** 結果已經回來的檢查 */
  results: string[];
  clues: string[];
  /** 拿到了、還沒解讀的線索 */
  pending: string[];
  reads: { clue: string; form: string; ok: boolean; t: number }[];
  /** 岑禾中途問「你最擔心哪一個」，和結案時的答案 */
  commits: { t: number; form: string }[];
  needCommit: boolean;
  /** 最後一次量到的生命徵象。沒量過是 null：不知道的就是不知道 */
  vitalsSeen: { at: number; v: Vitals } | null;
  vitalsLog: number[];
  worsenedAt: number | null;
  /** 有人知道這裡需要幫忙的時間：敲鐘，或是直接回報 */
  calledAt: number | null;
  calledBy: 'you' | 'mentor' | null;
  /** 敲過值班鐘 */
  bell: boolean;
  doctorAt: number | null;
  doctorHere: boolean;
  report: { at: number; a: string; r: string[] } | null;
  testRead: boolean;
  board: Board;
  explained: string[] | null;
  hints: number;
  closedAt: number | null;
  log: LogEntry[];
}

export type Action =
  | { type: 'advance' }
  | { type: 'ask'; id: string }
  | { type: 'vitals' }
  | { type: 'exam'; id: string; explain: boolean }
  | { type: 'watch' }
  | { type: 'test'; id: string }
  | { type: 'read'; clue: string; form: string; dir?: 1 | -1 }
  | { type: 'commit'; form: string }
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
  | { type: 'read'; id: string; ok: boolean }
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
