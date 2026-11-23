// 存在這台裝置上的進度。遊戲只讀這一份；存不了也不影響玩。
// 要換裝置：登入同步（account.ts），或是用 backup.ts 匯出一份帶過去。
import type { Safety, Session } from '../core/types.ts';

/** 一個病例留下來的紀錄。reads 是解讀對的線索，會寫進圖鑑 */
export interface CaseRecord {
  best: number; safety: Safety; plays: number; seconds: number;
  /** 診斷對過沒有 */
  found: boolean;
  /** 有沒有回應病人最在意的事 */
  concern: boolean;
  reads: { clue: string; text: string; form: string; dir: 1 | -1 }[];
}
/** 一場試弓的結果。試煉不寫圖鑑、不算完成委託，只留這一筆 */
export interface TrialRecord { at: number; caseId: string; score: number; safety: Safety; seconds: number; timeUp: boolean; found: boolean }
/** 一場（委託或試弓）結束時留的一筆。陷阱紀錄和航海日誌都從這裡算。
 *  trapped：有沒有掉進那個主訴的陷阱（不認得的主訴是 null）；takeaway：回顧最後選的那一句 */
export interface PlayRecord { at: number; caseId: string; score: number; trial: boolean; found: boolean; trapped: boolean | null; takeaway: string | null }
/** 航海日誌裡自己寫的一句話。at 是最後改的時間：兩台裝置同一天都寫了，留後寫的那一句。寫空的就是刪掉 */
export interface DiaryNote { text: string; at: number }
/** hero：選了哪一位主角。還沒選是 null。trials：試弓的紀錄，新的在前面。
 *  後來加的（舊的存檔沒有）：days 是打卡的日子（streak.ts）；plays 是最近幾場，新的在前面；notes 是航海日誌裡自己寫的話，用日期當鍵 */
export interface Save { v: 3; beats: string[]; cases: Record<string, CaseRecord>; takeaways: string[]; hero: string | null; trials: TrialRecord[]; days?: string[]; plays?: PlayRecord[]; notes?: Record<string, DiaryNote> }

const KEY = 'mist-guild.v1';
const blank = (): Save => ({ v: 3, beats: [], cases: {}, takeaways: [], hero: null, trials: [] });

export function load(): Save {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, unknown>;
    if (raw.v === 3) { const s = { ...blank(), ...(raw as Partial<Save>) }; return { ...s, trials: Array.isArray(s.trials) ? s.trials : [] }; }
    // 舊版的存檔：只留「看過開場」，其他從頭來。流程、題目和診斷都改過了，舊的分數和圖鑑對不上
    const sawIntro = !!raw.introSeen || (Array.isArray(raw.beats) && raw.beats.includes('prologue'));
    return { ...blank(), beats: sawIntro ? ['prologue'] : [] };
  } catch { return blank(); }
}
export function store(s: Save) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 記不住也沒關係 */ }
}

/** 還沒結案的那一張委託。手機把頁面收掉、不小心關掉分頁，回來可以接著做 */
export interface Run { v: 1; caseId: string; session: Session; seconds: number; at: number; /** 是試弓，不是委託 */ trial?: boolean }

const RUN = 'mist-guild.run';
export function loadRun(): Run | null {
  try {
    const raw = JSON.parse(localStorage.getItem(RUN) || 'null') as Run | null;
    return raw && raw.v === 1 && typeof raw.caseId === 'string' && !!raw.session ? raw : null;
  } catch { return null; }
}
export function storeRun(r: Run | null) {
  try { if (r) localStorage.setItem(RUN, JSON.stringify(r)); else localStorage.removeItem(RUN); } catch { /* 記不住也沒關係 */ }
}
/** 從頭來過：這台裝置上的進度和還沒結案的委託都清掉 */
export function wipe(): Save {
  try { localStorage.removeItem(KEY); localStorage.removeItem(RUN); } catch { /* 沒有東西可以清 */ }
  return blank();
}
