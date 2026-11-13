// 病例模組：把「主訴」和「病例」分開寫。
//
// 主訴模組（ComplaintDef）寫一次：症影、四個診斷、問題庫、評估項目、檢查項目。
// 病例（CaseSpec）只寫這個病人的部分：他怎麼回答、檢查看到什麼、診斷是哪一個、劇本和評分。
//
// 這樣同一個主訴的每個病例，畫面上的選項一模一樣，玩家沒辦法從「有哪些題目」猜出答案；
// 要寫新病例也只要填回答，不用重寫整套題目。
import type { CaseDef, Clue, Exam, Question, TestDef, TrueForm, Vitals } from './types.ts';

export interface ComplaintDef {
  id: string;
  name: string;
  /** look：症影長什麼樣子，只給畫面用 */
  shadow: { name: string; lore: string; look?: string };
  /** 四個診斷 */
  forms: TrueForm[];
  questions: Omit<Question, 'answer' | 'clue'>[];
  exams: Omit<Exam, 'finding' | 'clue'>[];
  tests: Omit<TestDef, 'result' | 'pending' | 'clue'>[];
}

/** 線索不用自己取代號：問題 q-onset 的線索就是 c-onset */
export type ClueSpec = Omit<Clue, 'id'>;
export interface Reply { say: string; clue?: ClueSpec }

type Shared = 'complaintName' | 'shadow' | 'forms' | 'clues' | 'questions' | 'exams' | 'tests' | 'vitals';
export interface CaseSpec extends Omit<CaseDef, Shared> {
  vitals: { base: Vitals; worse?: Vitals; clue: ClueSpec };
  /** 問題代號 → 這個病人的回答 */
  answers: Record<string, Reply>;
  /** 評估代號 → 看到、聽到、摸到的結果 */
  findings: Record<string, Reply>;
  /** 檢查代號 → 結果；等不到結果的寫 pending */
  results: Record<string, { say?: string; pending?: string; clue?: ClueSpec }>;
}

export const clueIdOf = (sourceId: string) => 'c-' + sourceId.replace(/^[a-z]-/, '');

/** 把主訴模組和病例合起來，變成規則核心用的完整病例。少寫了哪一題的回答會直接報錯 */
export function resolveCase(m: ComplaintDef, spec: CaseSpec): CaseDef {
  if (spec.complaint !== m.id) throw new Error(spec.id + ' 寫的主訴是 ' + spec.complaint + '，不是 ' + m.id);
  const clues: Clue[] = [{ id: 'c-vitals', ...spec.vitals.clue }];
  const take = (kind: string, id: string, r: { clue?: ClueSpec } | undefined) => {
    if (!r) throw new Error(spec.id + ' 少了' + kind + ' ' + id + ' 的內容');
    if (!r.clue) return undefined;
    const cid = clueIdOf(id);
    clues.push({ id: cid, ...r.clue });
    return cid;
  };
  const extra = (kind: string, given: Record<string, unknown>, known: { id: string }[]) => Object.keys(given).forEach((id) => { if (!known.some((k) => k.id === id)) throw new Error(spec.id + ' 的' + kind + '寫了主訴模組裡沒有的代號：' + id); });
  extra('回答', spec.answers, m.questions); extra('評估結果', spec.findings, m.exams); extra('檢查結果', spec.results, m.tests);

  const questions = m.questions.map((q) => ({ ...q, answer: spec.answers[q.id]?.say ?? '', clue: take('問題', q.id, spec.answers[q.id]) }));
  const exams = m.exams.map((e) => ({ ...e, finding: spec.findings[e.id]?.say ?? '', clue: take('評估', e.id, spec.findings[e.id]) }));
  const tests = m.tests.map((t) => ({ ...t, result: spec.results[t.id]?.say, pending: spec.results[t.id]?.pending, clue: take('檢查', t.id, spec.results[t.id]) }));
  const { answers: _a, findings: _f, results: _r, vitals, ...rest } = spec;
  void _a; void _f; void _r;
  return { ...rest, complaintName: m.name, shadow: m.shadow, forms: m.forms, vitals: { base: vitals.base, worse: vitals.worse }, clues, questions, exams, tests };
}
