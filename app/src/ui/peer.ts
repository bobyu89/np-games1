// 同梯的燈：問後端「這一位病人，回傳統計的玩家裡幾場、幾場診斷對」。只送病例代號和日期，不送任何跟你有關的東西。
// 這一版沒有統計端點、沒有網路、或還不到 10 場，就什麼都不顯示。
import { STATS_URL, statsBuilt } from './stats.ts';

export interface Peer { n: number; found: number }
export async function fetchPeer(caseId: string, day: string | null): Promise<{ all: Peer | null; today: Peer | null } | null> {
  if (!statsBuilt) return null;
  try {
    const res = await fetch(STATS_URL + '/peer?c=' + encodeURIComponent(caseId) + (day ? '&day=' + day : ''), { credentials: 'omit' });
    if (!res.ok) return null;
    const j = (await res.json()) as { all?: Peer | null; today?: Peer | null };
    const ok = (p: unknown): p is Peer => !!p && typeof (p as Peer).n === 'number' && typeof (p as Peer).found === 'number';
    return { all: ok(j.all) ? j.all : null, today: ok(j.today) ? j.today : null };
  } catch { return null; }
}
