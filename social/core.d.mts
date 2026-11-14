// core.mjs 的型別，給 worker/（TypeScript）用。
export interface Entry { no: number; date: string; id: string; name: string; complaint: string; image: string; text: string }
export type Outcome = 'none' | 'no-token' | 'exists' | 'dry' | 'posted';
export const THREADS_API: string;
export const SITE_URL: string;
export function taipeiDate(now?: Date): string;
export function pick(schedule: Entry[], date: string): Entry | null;
export function headOf(entry: Pick<Entry, 'no'>): string;
export function alreadyPosted(posts: Array<{ text?: unknown } | null | undefined>, entry: Pick<Entry, 'no'>): boolean;
export function checkToken(info: { scopes?: string[]; expires_at?: number; issued_at?: number } | null, lastDate: string, now?: number): string[];
export function run(o: { schedule: Entry[]; token?: string; date?: string; dry?: boolean; checkImage?: boolean; api?: string; site?: string; log?: (line: string) => void }): Promise<Outcome>;
