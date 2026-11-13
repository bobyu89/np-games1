/// <reference types="vite/client" />
/** 這一版是哪一次提交建出來的（日期.提交代號）。vite.config.ts 填進來 */
declare const __BUILD__: string;

interface ImportMetaEnv {
  /** 匿名使用統計的端點：同一個網址底下的路徑（/api），或是另一個網站的完整網址。沒有給，遊戲就不會回傳任何東西 */
  readonly VITE_STATS_URL?: string;
}
