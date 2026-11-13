// 把當天的「每日一案」發到 Threads。由 .github/workflows/threads.yml 每天定時跑，也可以手動跑。
//
// 環境變數：
//   THREADS_ACCESS_TOKEN  Threads 的長期權杖（帳號主人授權來的）。沒有設定就什麼都不發，這不算錯
//   DRY_RUN=1             試跑：檢查到「要發了」為止，不真的發
//   POST_DATE=YYYY-MM-DD  要發哪一天的（預設是臺灣時間的今天）
//   SITE_URL、THREADS_API 圖放在哪個網站、API 的網址（有預設值，一般不用改）
// 權杖只放在環境變數裡，這支程式不會把它印出來。
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const API = (process.env.THREADS_API || 'https://graph.threads.com/v1.0').replace(/\/$/, '');
const SITE = (process.env.SITE_URL || 'https://mist-guild.shiftguard-navicare.workers.dev').replace(/\/$/, '');

/** 臺灣時間的今天，YYYY-MM-DD */
export const taipeiDate = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
/** 這一天排的是哪一則。沒有排就是 null */
export const pick = (schedule, date) => schedule.find((d) => d.date === date) ?? null;
/** 每一則的開頭（【每日一案 01），用來認帳號上是不是已經有這一則 */
export const headOf = (entry) => '【每日一案 ' + String(entry.no).padStart(2, '0');
/** 帳號最近的貼文裡有沒有這一則：手動發過、或是排程重跑，都不會再發第二次 */
export const alreadyPosted = (posts, entry) => posts.some((p) => typeof p?.text === 'string' && p.text.startsWith(headOf(entry)));

/**
 * 權杖的狀況（Threads 的 debug_token 回來的）：哪一天過期、撐不撐得到日程走完。
 * 沒有發文的權限就直接停下來，免得每天早上才失敗。回傳要寫進紀錄的幾行字。
 */
export function checkToken(info, lastDate, now = Date.now()) {
  if (!info) return ['查不到權杖的效期（Threads 沒有回答這一項），其他檢查照常。'];
  if (Array.isArray(info.scopes) && !info.scopes.includes('threads_content_publish')) throw new Error('這組權杖沒有發文的權限（threads_content_publish）。到 Meta 的應用程式把這個權限加上，再重新產生一組權杖。');
  const exp = Number(info.expires_at), born = Number(info.issued_at);
  if (!(exp > 0)) return ['權杖沒有寫到期日。'];
  const until = taipeiDate(new Date(exp * 1000)), days = Math.max(0, Math.floor((exp * 1000 - now) / 86_400_000));
  const out = ['權杖到 ' + until + ' 過期（還有 ' + days + ' 天）。'];
  if (born > 0 ? exp - born < 86_400 : exp * 1000 - now < 86_400_000) out.push('注意：這是短期權杖，一個小時左右就失效，明天早上的排程用不了。要換成長期權杖（六十天）。');
  else if (until <= lastDate) out.push('注意：日程排到 ' + lastDate + '，權杖撐不到那一天。' + until + ' 之前要重新產生一組、換掉 secret。');
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function call(method, path, params, token) {
  const body = new URLSearchParams({ ...params, access_token: token });
  const res = method === 'GET' ? await fetch(API + path + '?' + body) : await fetch(API + path, { method, body });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.error) {
    const why = String(data?.error?.message ?? res.status).replaceAll(token, '***');
    throw new Error('Threads 回應 ' + res.status + '：' + why);
  }
  return data;
}

export async function main(env = process.env, log = console.log) {
  const schedule = JSON.parse(readFileSync(join(here, 'schedule.json'), 'utf8'));
  const token = env.THREADS_ACCESS_TOKEN || '', dry = ['1', 'true'].includes(String(env.DRY_RUN || '').toLowerCase());
  const date = env.POST_DATE || taipeiDate(), entry = pick(schedule, date);
  if (!entry) { log(date + ' 沒有排貼文。'); return 'none'; }
  const image = SITE + '/' + entry.image;
  log(date + '：每日一案 ' + String(entry.no).padStart(2, '0') + '（' + entry.name + '，' + entry.complaint + '），' + entry.text.length + ' 字元');
  // 圖是 Threads 自己到網站上抓的，所以要先確定網站上有
  const got = await fetch(image);
  if (!got.ok || !(got.headers.get('content-type') || '').startsWith('image/')) throw new Error('網站上抓不到這張圖：' + image + '（' + got.status + '）。圖要先合併、部署上去。');
  if (!token) { log('還沒有設定 THREADS_ACCESS_TOKEN，所以不發。設定的方法在 social/README.md。'); return 'no-token'; }
  const me = await call('GET', '/me', { fields: 'id,username' }, token);
  const info = await call('GET', '/debug_token', { input_token: token }, token).then((r) => r?.data ?? r, () => null);
  for (const line of checkToken(info, schedule.at(-1).date)) log(line);
  const recent = await call('GET', '/' + me.id + '/threads', { fields: 'id,text,timestamp', limit: '30' }, token);
  if (alreadyPosted(recent.data ?? [], entry)) { log('@' + me.username + ' 上面已經有這一則，不重複發。'); return 'exists'; }
  if (dry) { log('試跑：檢查都過了，會發到 @' + me.username + '。這一次沒有真的發。'); return 'dry'; }
  // 兩步：先交出圖和文字，等 Threads 處理好，再發布
  const box = await call('POST', '/' + me.id + '/threads', { media_type: 'IMAGE', image_url: image, text: entry.text }, token);
  for (let i = 0; i < 12; i++) {
    await sleep(10_000);
    const st = await call('GET', '/' + box.id, { fields: 'status,error_message' }, token).catch(() => null);
    if (st?.status === 'FINISHED') break;
    if (st?.status === 'ERROR' || st?.status === 'EXPIRED') throw new Error('Threads 沒有處理好這張圖：' + (st.error_message || st.status));
    if (!st && i >= 2) break;   // 查不到狀態：等滿三十秒就照文件說的直接發布
  }
  const out = await call('POST', '/' + me.id + '/threads_publish', { creation_id: box.id }, token);
  log('發出去了：@' + me.username + '，貼文代號 ' + out.id);
  return 'posted';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
