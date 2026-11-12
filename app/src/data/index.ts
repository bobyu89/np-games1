// 內容的總目錄：有哪些主訴模組、哪些病例。要加新病例，寫好之後在這裡登記一行。
import type { CaseDef } from '../core/types.ts';
import { resolveCase, type ComplaintDef } from '../core/module.ts';
import { CHEST_PAIN } from './chest-pain.ts';
import { C01A } from './c01a.ts';
import { C01B } from './c01b.ts';
import { C01C } from './c01c.ts';
import { C01D } from './c01d.ts';

export const COMPLAINTS: ComplaintDef[] = [CHEST_PAIN];
export const CASES: CaseDef[] = [resolveCase(CHEST_PAIN, C01A), resolveCase(CHEST_PAIN, C01B), resolveCase(CHEST_PAIN, C01C), resolveCase(CHEST_PAIN, C01D)];
export const caseById = (id: string) => CASES.find((c) => c.id === id)!;
