// 每天早上把當天的「每日一案」發到遊戲的 Threads 帳號。由 Cloudflare 的定時器叫起來（wrangler.jsonc 的 triggers）。
// 發文的流程和 GitHub 那一邊（social/post.mjs）是同一份：social/core.mjs。日程是部署當下的 social/schedule.json。
// 權杖是 Worker 的 secret：THREADS_ACCESS_TOKEN。沒有設定就什麼都不發。
import schedule from '../../social/schedule.json' with { type: 'json' };
import { run, type Outcome } from '../../social/core.mjs';

export interface DailyEnv {
  THREADS_ACCESS_TOKEN?: string;
  // 只有測試會設：把 Threads 換成本機的假服務
  THREADS_API?: string;
}

export function daily(env: DailyEnv, log: (line: string) => void = console.log): Promise<Outcome> {
  // 圖和這個 Worker 在同一個網址底下，Worker 不能回頭抓自己的網址，所以這裡不先抓圖；
  // Threads 抓不到的話，它會回報處理失敗，流程一樣會停下來
  return run({ schedule, token: env.THREADS_ACCESS_TOKEN ?? '', checkImage: false, api: env.THREADS_API || undefined, log });
}
