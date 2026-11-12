// 內容的總目錄：有哪些主訴模組、哪些病例。要加新病例，寫好之後在這裡登記一行。
import type { CaseDef } from '../core/types.ts';
import { resolveCase, type ComplaintDef } from '../core/module.ts';
import { CHEST_PAIN } from './chest-pain.ts';
import { C01A } from './c01a.ts';
import { C01B } from './c01b.ts';
import { C01C } from './c01c.ts';
import { C01D } from './c01d.ts';
import { DYSPNEA } from './dyspnea.ts';
import { C02A } from './c02a.ts';
import { C02B } from './c02b.ts';
import { C02C } from './c02c.ts';
import { C02D } from './c02d.ts';
import { ABDOMEN } from './abdomen.ts';
import { C03A } from './c03a.ts';
import { C03B } from './c03b.ts';
import { C03C } from './c03c.ts';
import { C03D } from './c03d.ts';
import { FEVER } from './fever.ts';
import { C04A } from './c04a.ts';
import { C04B } from './c04b.ts';
import { HEADACHE } from './headache.ts';
import { C05A } from './c05a.ts';
import { C05B } from './c05b.ts';

export const COMPLAINTS: ComplaintDef[] = [CHEST_PAIN, DYSPNEA, ABDOMEN, FEVER, HEADACHE];
export const CASES: CaseDef[] = [resolveCase(CHEST_PAIN, C01A), resolveCase(CHEST_PAIN, C01B), resolveCase(CHEST_PAIN, C01C), resolveCase(CHEST_PAIN, C01D),
  resolveCase(DYSPNEA, C02A), resolveCase(DYSPNEA, C02B), resolveCase(DYSPNEA, C02C), resolveCase(DYSPNEA, C02D),
  resolveCase(ABDOMEN, C03A), resolveCase(ABDOMEN, C03B), resolveCase(ABDOMEN, C03C), resolveCase(ABDOMEN, C03D),
  resolveCase(FEVER, C04A), resolveCase(FEVER, C04B), resolveCase(HEADACHE, C05A), resolveCase(HEADACHE, C05B)];
export const caseById = (id: string) => CASES.find((c) => c.id === id)!;
