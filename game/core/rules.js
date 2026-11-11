// 規則的數值都集中在這裡。調平衡只改這一個檔。
// 這些數字是架構階段的示意值，內容階段會再調。

export const RULES = Object.freeze({
  hpMax: 100,

  // 急迫程度決定開場血量和每回合掉多少血
  acuity: Object.freeze({
    急: Object.freeze({ startHp: 60, drain: 5 }),
    亞急: Object.freeze({ startHp: 70, drain: 4 }),
    慢: Object.freeze({ startHp: 80, drain: 3 }),
  }),
  practiceDrainCut: 2, // 練習模式每回合少掉 2

  heal: Object.freeze({
    facetBase: 3, facetPerWeight: 2,          // 第一次問某個面向
    zoneComplete: 5,                          // 一整區問齊
    followBase: 2, followPerWeight: 2,        // 追問到一般線索
    followKeyBase: 8, followKeyPerWeight: 2,  // 追問到關鍵線索
    examBase: 3, examPerWeight: 2,            // 和主訴相關的身體評估
    examKeyBonus: 2,
    examInOrderBonus: 1,                      // 照常規順序做
    diagnosisRight: 20,
    diagnosisWrong: -25,
    workupNecessary: 15,
    workupOptional: 3,
  }),

  veilFloor: 10,        // 線索全找到時面紗還剩多少。提出正確診斷才全開
  maxDifferentials: 3,  // 主診斷之外，最多再選幾個鑑別診斷

  // 計分各軸的比重，加起來 100
  scoreWeights: Object.freeze({ systems: 10, interview: 30, exam: 20, differential: 20, workup: 10, hp: 10 }),
  stars: Object.freeze({ three: 90, two: 75 }),
});

export const MODES = Object.freeze(['practice', 'osce']);
export const MODE_NAMES = Object.freeze({ practice: '練習', osce: 'OSCE' });

export const DIFFICULTIES = Object.freeze(['初', '中', '高']);
export const CASE_TYPES = Object.freeze(['典型', '陷阱']);
export const DX_ROLES = Object.freeze(['主診斷', '不能漏掉', '合理鑑別', '干擾']);
export const WORKUP_ROLES = Object.freeze(['必要', '可開可不開', '不必要']);
export const WORKUP_KINDS = Object.freeze(['檢驗', '影像', '檢查']);

export function drainFor(acuity, mode) {
  const a = RULES.acuity[acuity];
  if (!a) throw new Error('不認得的急迫程度：' + acuity);
  return mode === 'practice' ? Math.max(1, a.drain - RULES.practiceDrainCut) : a.drain;
}
