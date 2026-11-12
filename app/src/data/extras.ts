// 第四章以後，每個主訴自己的文獻檔另外帶三樣東西：文獻核對到哪裡、要請臨床老師特別看的地方、病人後來的事。
// 這裡把它們和 shared.ts 裡原本的接起來，給審查清單和圖鑑用。
import { REF_CHECK, REVIEW_ASKS } from './shared.ts';
import * as back from './back-pain.refs.ts';
import * as leg from './leg-pain.refs.ts';
import * as swelling from './swelling.refs.ts';
import * as excreta from './excreta.refs.ts';
import * as rash from './rash.refs.ts';
import * as weight from './weight-loss.refs.ts';
import * as pares from './paresthesia.refs.ts';

const ADD = [back, leg, swelling, excreta, rash, weight, pares];
export const ALL_REF_CHECK: Record<string, { level: 'abstract' | 'biblio'; note?: string }> = Object.assign({}, REF_CHECK, ...ADD.map((m) => m.REF_CHECK_ADD));
export const ALL_REVIEW_ASKS: string[] = [...REVIEW_ASKS, ...ADD.flatMap((m) => m.REVIEW_ASKS_ADD)];
export const AFTER_MORE: Record<string, string> = Object.assign({}, ...ADD.map((m) => m.AFTER_ADD));
