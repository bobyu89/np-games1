// 存在這台裝置上的進度。還沒有帳號和伺服器之前先這樣；存不了也不影響玩。
import type { Safety } from '../core/types.ts';

export interface Result { best: number; safety: Safety; plays: number }
export interface Save { introSeen: boolean; results: Record<string, Result>; takeaway: string | null }

const KEY = 'mist-guild.v1';
const blank = (): Save => ({ introSeen: false, results: {}, takeaway: null });

export function load(): Save {
  try { return { ...blank(), ...(JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Save>) }; } catch { return blank(); }
}
export function store(s: Save) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 記不住也沒關係 */ }
}
