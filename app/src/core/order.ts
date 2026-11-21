// 選項顯示的順序（病室裡的下診斷、回報、說明三張單子用）
/**
 * 選項顯示的順序。病例檔裡對的那一句都寫在最前面，照檔案的順序列出來，等於告訴玩家「選第一個」。
 * 這裡用病例代號和選項代號算一個固定的順序：同一張委託每次看到的順序一樣，換一張就不一樣。
 */
export function shuffled<T extends { id: string }>(caseId: string, list: T[]): T[] {
  const key = (id: string) => { let h = 2166136261; for (const ch of caseId + '/' + id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  return [...list].sort((a, b) => key(a.id) - key(b.id));
}
