// core.mjs 的型別，給 worker/（TypeScript）用。
/** 一則貼文。每日的有 date；手動發的公告沒有。image 和 video 只會有一個；tag 是 Threads 的主題標籤（一則一個） */
export interface Entry { no: number; date: string | null; id: string; name?: string; complaint?: string; head?: string; image?: string; video?: string; tag?: string; text: string }
export type Outcome = 'none' | 'no-token' | 'exists' | 'dry' | 'posted';
export const THREADS_API: string;
export const SITE_URL: string;
export function taipeiDate(now?: Date): string;
export function pick(schedule: Entry[], date: string): Entry | null;
export function pickId(schedule: Entry[], id: string): Entry | null;
export function lastDate(schedule: Entry[]): string;
export function headOf(entry: Pick<Entry, 'no'> & { head?: string }): string;
export function alreadyPosted(posts: Array<{ text?: unknown } | null | undefined>, entry: Pick<Entry, 'no'> & { head?: string }): boolean;
export function checkToken(info: { scopes?: string[]; expires_at?: number; issued_at?: number } | null, lastDate: string, now?: number): string[];
export function run(o: { schedule: Entry[]; token?: string; date?: string; id?: string; dry?: boolean; checkImage?: boolean; api?: string; site?: string; log?: (line: string) => void }): Promise<Outcome>;
