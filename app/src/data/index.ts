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
import { C04C } from './c04c.ts';
import { C04D } from './c04d.ts';
import { HEADACHE } from './headache.ts';
import { C05A } from './c05a.ts';
import { C05B } from './c05b.ts';
import { C05C } from './c05c.ts';
import { C05D } from './c05d.ts';

import { BACK_PAIN } from './back-pain.ts';
import { C06A } from './c06a.ts';
import { C06B } from './c06b.ts';
import { C06C } from './c06c.ts';
import { C06D } from './c06d.ts';
import { LEG_PAIN } from './leg-pain.ts';
import { C07A } from './c07a.ts';
import { C07B } from './c07b.ts';
import { C07C } from './c07c.ts';
import { C07D } from './c07d.ts';
import { SWELLING } from './swelling.ts';
import { C08A } from './c08a.ts';
import { C08B } from './c08b.ts';
import { C08C } from './c08c.ts';
import { C08D } from './c08d.ts';
import { EXCRETA } from './excreta.ts';
import { C09A } from './c09a.ts';
import { C09B } from './c09b.ts';
import { C09C } from './c09c.ts';
import { C09D } from './c09d.ts';
import { RASH } from './rash.ts';
import { C10A } from './c10a.ts';
import { C10B } from './c10b.ts';
import { C10C } from './c10c.ts';
import { C10D } from './c10d.ts';
import { WEIGHT_LOSS } from './weight-loss.ts';
import { C11A } from './c11a.ts';
import { C11B } from './c11b.ts';
import { C11C } from './c11c.ts';
import { C11D } from './c11d.ts';
import { PARESTHESIA } from './paresthesia.ts';
import { C12A } from './c12a.ts';
import { C12B } from './c12b.ts';
import { C12C } from './c12c.ts';
import { C12D } from './c12d.ts';
export const COMPLAINTS: ComplaintDef[] = [CHEST_PAIN, DYSPNEA, ABDOMEN, FEVER, HEADACHE,
  BACK_PAIN, LEG_PAIN, SWELLING, EXCRETA, RASH, WEIGHT_LOSS, PARESTHESIA];
export const CASES: CaseDef[] = [resolveCase(CHEST_PAIN, C01A), resolveCase(CHEST_PAIN, C01B), resolveCase(CHEST_PAIN, C01C), resolveCase(CHEST_PAIN, C01D),
  resolveCase(DYSPNEA, C02A), resolveCase(DYSPNEA, C02B), resolveCase(DYSPNEA, C02C), resolveCase(DYSPNEA, C02D),
  resolveCase(ABDOMEN, C03A), resolveCase(ABDOMEN, C03B), resolveCase(ABDOMEN, C03C), resolveCase(ABDOMEN, C03D),
  resolveCase(FEVER, C04A), resolveCase(FEVER, C04B), resolveCase(FEVER, C04C), resolveCase(FEVER, C04D),
  resolveCase(HEADACHE, C05A), resolveCase(HEADACHE, C05B), resolveCase(HEADACHE, C05C), resolveCase(HEADACHE, C05D),
  resolveCase(BACK_PAIN, C06A), resolveCase(BACK_PAIN, C06B), resolveCase(BACK_PAIN, C06C), resolveCase(BACK_PAIN, C06D),
  resolveCase(LEG_PAIN, C07A), resolveCase(LEG_PAIN, C07B), resolveCase(LEG_PAIN, C07C), resolveCase(LEG_PAIN, C07D),
  resolveCase(SWELLING, C08A), resolveCase(SWELLING, C08B), resolveCase(SWELLING, C08C), resolveCase(SWELLING, C08D),
  resolveCase(EXCRETA, C09A), resolveCase(EXCRETA, C09B), resolveCase(EXCRETA, C09C), resolveCase(EXCRETA, C09D),
  resolveCase(RASH, C10A), resolveCase(RASH, C10B), resolveCase(RASH, C10C), resolveCase(RASH, C10D),
  resolveCase(WEIGHT_LOSS, C11A), resolveCase(WEIGHT_LOSS, C11B), resolveCase(WEIGHT_LOSS, C11C), resolveCase(WEIGHT_LOSS, C11D),
  resolveCase(PARESTHESIA, C12A), resolveCase(PARESTHESIA, C12B), resolveCase(PARESTHESIA, C12C), resolveCase(PARESTHESIA, C12D)];
export const caseById = (id: string) => CASES.find((c) => c.id === id)!;
