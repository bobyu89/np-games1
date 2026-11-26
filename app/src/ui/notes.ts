// 考前速記：十二種主訴，每一種一節。內容全部從病例檔取出來，不另外寫：
// 四個鑑別方向（哪幾個不能漏）、重點的身體評估、下了診斷要先提出的檢查、這一劫的陷阱，
// 和那一種主訴每一位病人的教學重點（附文獻）。終章燈塔那一位不列，留給故事。
import { CASES, COMPLAINTS, FINALE_ID } from '../data/index.ts';
import { PERILS, type Peril } from '../data/odyssey.ts';
import type { TrueForm } from '../core/types.ts';

export interface NoteRef { id: string; text: string; doi: string }
export interface Note {
  complaint: string;
  name: string;
  shadow: string;
  forms: TrueForm[];
  /** 權重 2 以上的身體評估（同一個主訴每一位都一樣） */
  exams: string[];
  /** 下了診斷之後要先提出的檢查（不同病人不一樣，列出全部、不重複）。遊戲裡的時限是模擬的秒數，不列：臨床的時限看教學重點 */
  orders: { label: string }[];
  peril: Peril | null;
  /** 教學重點，ref 是 refs 的第幾篇（從 0 開始）；同一句不重複 */
  points: { text: string; ref: number }[];
  refs: NoteRef[];
}

export function notes(): Note[] {
  return COMPLAINTS.map((m) => {
    const cases = CASES.filter((c) => c.complaint === m.id && c.id !== FINALE_ID);
    const refs: NoteRef[] = [], points: Note['points'] = [], orders: Note['orders'] = [];
    for (const c of cases) {
      for (const t of c.debrief.teaching) {
        const r = c.debrief.references.find((x) => x.id === t.ref);
        if (!r || points.some((p) => p.text === t.text)) continue;
        let i = refs.findIndex((x) => x.id === r.id);
        if (i < 0) { refs.push(r); i = refs.length - 1; }
        points.push({ text: t.text, ref: i });
      }
      for (const rule of c.safety) {
        if (rule.type !== 'order') continue;
        const label = c.tests.find((t) => t.id === rule.test)!.label;
        if (!orders.some((o) => o.label === label)) orders.push({ label });
      }
    }
    const first = cases[0];
    return { complaint: m.id, name: m.name, shadow: m.shadow.name, forms: m.forms, exams: first ? first.exams.filter((e) => e.weight >= 2).map((e) => e.label) : [], orders, peril: PERILS[m.id] ?? null, points, refs };
  });
}

/** 打開速記頁（換網址後面那一段，App 會接手） */
export const openNotes = () => { location.hash = '#notes'; };
