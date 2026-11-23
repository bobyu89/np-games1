// 每日貼文（每日一案、歸航記）和沒有日期的公告，發到 Threads 的那一段流程。不碰檔案、不讀環境變數，所以兩個地方都能用：
//   worker/src/index.ts  Cloudflare 的定時器，每天早上發（主要的）
//   social/post.mjs      GitHub 的排程和手動跑（後備、試跑）
// 權杖只當參數傳進來，不會寫進紀錄；Threads 回的錯誤訊息裡有權杖的話會遮掉。

export const THREADS_API = 'https://graph.threads.com/v1.0';
export const SITE_URL = 'https://mist-guild.shiftguard-navicare.workers.dev';

/** 臺灣時間的今天，YYYY-MM-DD */
export const taipeiDate = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
/** 這一天排的是哪一則。沒有排就是 null */
export const pick = (schedule, date) => schedule.find((d) => d.date === date) ?? null;
/** 指定某一則（手動發的，例如更新的公告；它們沒有日期） */
export const pickId = (schedule, id) => schedule.find((d) => d.id === id) ?? null;
/** 每一則的開頭（【每日一案 01、【歸航記 01），用來認帳號上是不是已經有這一則 */
export const headOf = (entry) => entry.head ?? '【每日一案 ' + String(entry.no).padStart(2, '0');
/** 日程排到哪一天（沒有日期的公告不算） */
export const lastDate = (schedule) => schedule.map((d) => d.date).filter(Boolean).sort().at(-1) ?? '';
/** 帳號最近的貼文裡有沒有這一則：手動發過、或是另一邊已經發了，都不會再發第二次 */
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

/**
 * 發某一天的那一則。回傳做到哪裡：
 *   none 那一天沒有排　no-token 沒有權杖，什麼都沒發　exists 帳號上已經有　dry 試跑，做到發布的前一步　posted 發出去了
 * @param {object} o
 * @param {Array} o.schedule 日程（social/schedule.json）
 * @param {string} [o.token] Threads 的長期權杖
 * @param {string} [o.date] 要發哪一天的，YYYY-MM-DD（預設是臺灣時間的今天）
 * @param {string} [o.id] 指定發哪一則（日程裡的 id）。有給就不看日期，用來發沒有日期的公告
 * @param {boolean} [o.dry] 試跑：圖和文字交給 Threads 收下，不發布
 * @param {boolean} [o.checkImage] 先自己抓一次圖，確定網站上有（預設會抓。在 Cloudflare 上不能抓自己的網址，那裡關掉，由 Threads 抓的結果來判斷）
 * @param {string} [o.api] @param {string} [o.site] @param {(line: string) => void} [o.log]
 */
export async function run({ schedule, token = '', date = taipeiDate(), id = '', dry = false, checkImage = true, api = THREADS_API, site = SITE_URL, log = console.log }) {
  api = api.replace(/\/$/, ''); site = site.replace(/\/$/, '');
  const call = async (method, path, params) => {
    const body = new URLSearchParams({ ...params, access_token: token });
    const res = method === 'GET' ? await fetch(api + path + '?' + body) : await fetch(api + path, { method, body });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.error) {
      const why = String(data?.error?.message ?? res.status).replaceAll(token, '***');
      throw new Error('Threads 回應 ' + res.status + '：' + why);
    }
    return data;
  };
  const entry = id ? pickId(schedule, id) : pick(schedule, date);
  if (!entry) { log((id ? '日程裡沒有「' + id + '」這一則。' : date + ' 沒有排貼文。')); return 'none'; }
  // 圖或影片：一則只有一個。影片是 Threads 自己到網站上抓、再轉檔的，要等比較久
  const video = !!entry.video, media = site + '/' + (entry.video ?? entry.image), kind = video ? 'video/' : 'image/';
  log((entry.date ?? '公告') + '：' + headOf(entry).replace('【', '') + '（' + (entry.name ?? entry.id) + (entry.complaint ? '，' + entry.complaint : '') + '），' + (video ? '影片，' : '') + entry.text.length + ' 字元');
  // 圖和影片是 Threads 自己到網站上抓的，所以要先確定網站上有
  if (checkImage) {
    const got = await fetch(media, { method: video ? 'HEAD' : 'GET' });
    if (!got.ok || !(got.headers.get('content-type') || '').startsWith(kind)) throw new Error('網站上抓不到這個檔：' + media + '（' + got.status + '）。要先合併、部署上去。');
  }
  if (!token) { log('還沒有設定 THREADS_ACCESS_TOKEN，所以不發。設定的方法在 social/README.md。'); return 'no-token'; }
  const me = await call('GET', '/me', { fields: 'id,username' });
  const info = await call('GET', '/debug_token', { input_token: token }).then((r) => r?.data ?? r, () => null);
  for (const line of checkToken(info, lastDate(schedule))) log(line);
  const recent = await call('GET', '/' + me.id + '/threads', { fields: 'id,text,timestamp', limit: '30' });
  if (alreadyPosted(recent.data ?? [], entry)) { log('@' + me.username + ' 上面已經有這一則，不重複發。'); return 'exists'; }
  // 兩步：先交出圖和文字，等 Threads 處理好，再發布。試跑做完第一步就停：
  // 發文的權限對不對、Threads 抓不抓得到圖，都是第一步才知道的
  const params = video ? { media_type: 'VIDEO', video_url: media, text: entry.text } : { media_type: 'IMAGE', image_url: media, text: entry.text };
  if (entry.tag) params.topic_tag = entry.tag; // 主題標籤：一則只能一個
  const box = await call('POST', '/' + me.id + '/threads', params);
  let ready = false;
  // 圖通常幾秒就好；影片要轉檔，最多等五分鐘
  for (let i = 0; i < (video ? 30 : 12) && !ready; i++) {
    await sleep(10_000);
    const st = await call('GET', '/' + box.id, { fields: 'status,error_message' }).catch(() => null);
    ready = st?.status === 'FINISHED';
    if (st?.status === 'ERROR' || st?.status === 'EXPIRED') throw new Error('Threads 沒有處理好這' + (video ? '段影片' : '張圖') + '：' + (st.error_message || st.status));
    if (!st && i >= 2 && !video) break;   // 查不到狀態：等滿三十秒就照文件說的直接發布
  }
  if (video && !ready && !dry) throw new Error('影片等了五分鐘還沒處理好，這一次先不發布。過一陣子再跑一次。');
  if (dry) {
    log('試跑：' + (ready ? 'Threads 收下了這一則的' + (video ? '影片' : '圖') + '和文字，處理好了' : 'Threads 收了這一則，但是還查不到處理好了沒') + '，只差發布。會發到 @' + me.username + '。');
    log('這一次沒有真的發；交出去的那一份沒有發布，二十四小時後自己過期。');
    return 'dry';
  }
  const out = await call('POST', '/' + me.id + '/threads_publish', { creation_id: box.id });
  log('發出去了：@' + me.username + '，貼文代號 ' + out.id);
  return 'posted';
}
