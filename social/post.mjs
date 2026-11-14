// 把當天的「每日一案」發到 Threads：GitHub 這一邊的入口（.github/workflows/threads.yml 的後備排程、手動跑、試跑）。
// 每天早上主要是 Cloudflare 的定時器在發（worker/src/index.ts）；兩邊用的是同一段流程：core.mjs。
//
// 環境變數：
//   THREADS_ACCESS_TOKEN  Threads 的長期權杖（帳號主人授權來的）。沒有設定就什麼都不發，這不算錯
//   DRY_RUN=1             試跑：做到發布的前一步（圖和文字交給 Threads 收下），不真的發。沒發布的那一份二十四小時後自己過期
//   POST_DATE=YYYY-MM-DD  要發哪一天的（預設是臺灣時間的今天）
//   SITE_URL、THREADS_API 圖放在哪個網站、API 的網址（有預設值，一般不用改）
// 權杖只放在環境變數裡，這支程式不會把它印出來。
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from './core.mjs';

export { alreadyPosted, checkToken, headOf, pick, run, taipeiDate } from './core.mjs';

const here = dirname(fileURLToPath(import.meta.url));

export async function main(env = process.env, log = console.log) {
  return run({
    schedule: JSON.parse(readFileSync(join(here, 'schedule.json'), 'utf8')),
    token: env.THREADS_ACCESS_TOKEN || '',
    date: env.POST_DATE || undefined,
    dry: ['1', 'true'].includes(String(env.DRY_RUN || '').toLowerCase()),
    api: env.THREADS_API || undefined,
    site: env.SITE_URL || undefined,
    log,
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
