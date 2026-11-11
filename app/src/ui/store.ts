// 存在這台裝置上的進度。還沒有帳號和伺服器之前先這樣；存不了也不影響玩。
import type { Safety } from '../core/types.ts';

/** 一個病例留下來的紀錄。reads 是解讀對的線索，會寫進圖鑑 */
export interface CaseRecord {
  best: number; safety: Safety; plays: number; seconds: number;
  /** 有沒有認出真身 */
  found: boolean;
  /** 有沒有回應病人最在意的事 */
  concern: boolean;
  reads: { clue: string; text: string; form: string; dir: 1 | -1 }[];
}
export interface Save { v: 2; beats: string[]; cases: Record<string, CaseRecord>; takeaways: string[] }

const KEY = 'mist-guild.v1';
const blank = (): Save => ({ v: 2, beats: [], cases: {}, takeaways: [] });

export function load(): Save {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, unknown>;
    if (raw.v === 2) return { ...blank(), ...(raw as Partial<Save>) };
    // 第一版的存檔：只留「看過開場」，其他從頭來（規則改了，舊的分數不能比）
    return { ...blank(), beats: raw.introSeen ? ['prologue'] : [] };
  } catch { return blank(); }
}
export function store(s: Save) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 記不住也沒關係 */ }
}
