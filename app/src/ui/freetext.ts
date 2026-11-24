// 自由作答的鑑別診斷：下診斷之前，先不看四盞燈，自己寫下想到的診斷，再對照。
// 這是「回想」，選四盞燈是「辨認」；先回想再辨認，練的是腦子裡真的有沒有這幾個診斷。
// 只比對字（同義詞表在 data/aliases.ts），不叫 AI、不判斷寫得好不好，也不計分。
import { ALIASES } from '../data/aliases.ts';
import type { TrueForm } from '../core/types.ts';

/** 一次最多寫幾個、每一個多長。多的丟掉 */
export const WRITE_MAX = 8, WRITE_LEN = 40;

/** 比對用：全形轉半形、英文小寫、去掉空白和引號的差別 */
export const normalize = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim();

/** 把玩家寫的一段字切成一個一個診斷：頓號、逗號、分號、斜線、換行、「和」「或」「及」「跟」都算分隔 */
export function splitGuesses(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[、，,;；/／\n|]|以及|還有|或是|或者|和|或|及|跟|\+/)) {
    const t = raw.trim().slice(0, WRITE_LEN);
    if (t && !out.some((k) => normalize(k) === normalize(t))) out.push(t);
    if (out.length >= WRITE_MAX) break;
  }
  return out;
}

const latin = (a: string) => /[a-z0-9]/.test(a) && !/[㐀-鿿]/.test(a);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** 英文和縮寫要整個字對上（mi 不能對到 migraine）；中文只要包含 */
function hit(text: string, alias: string): boolean {
  const a = normalize(alias);
  if (!a) return false;
  return latin(a) ? new RegExp('(^|[^a-z0-9])' + escape(a) + '($|[^a-z0-9])').test(text) : text.includes(a);
}

/** 一個診斷對到哪幾個方向。同一段字對到好幾個寫法時，留最長的那幾個（「過敏性紫斑」不算「過敏」） */
export function matchOne(text: string, forms: TrueForm[], aliases: Record<string, string[]> = {}): string[] {
  const t = normalize(text);
  const hits = forms.flatMap((f) => [f.name, ...(aliases[f.id] ?? [])].filter((a) => hit(t, a)).map((a) => ({ form: f.id, a: normalize(a) })));
  const kept = hits.filter((h) => !hits.some((o) => o.form !== h.form && o.a.length > h.a.length && o.a.includes(h.a)));
  return forms.map((f) => f.id).filter((id) => kept.some((h) => h.form === id));
}

export interface Written { text: string; forms: string[] }
/** 整段寫的字 → 每一個診斷對到哪幾個方向（空陣列：四個方向都沒對到） */
export function matchWritten(complaint: string, forms: TrueForm[], text: string | string[]): Written[] {
  const list = Array.isArray(text) ? text : splitGuesses(text);
  return list.map((t) => ({ text: t, forms: matchOne(t, forms, ALIASES[complaint]) }));
}

/** 寫到了哪幾個方向（不重複，照四盞燈的順序） */
export const formsWritten = (forms: TrueForm[], w: Written[]) => forms.map((f) => f.id).filter((id) => w.some((k) => k.forms.includes(id)));
