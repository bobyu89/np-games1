// 霧脈公會的離線快取。這個檔是建置的時候產生的，不要手改；來源是 app/tools/sw.template.js。
// 做法：安裝的時候把整個遊戲抓下來存好，之後一律先用存好的那一份，所以沒有網路也能玩。
// 換版：內容一變，BUILD 就會變，瀏覽器會在背景把新版抓好、放著等；玩家在大廳按了「更新」才換上。
const BUILD = '__BUILD__';
const CACHE = 'mist-guild-' + BUILD;
const CORE = __CORE__;     // 少一個就不算裝好
const EXTRA = __EXTRA__;   // 字體：抓不到就先用裝置上的字，之後用到再補
const API = new URL('api/', self.registration.scope).pathname;   // 後端的網址：不存、不攔，每次都直接連出去
const fresh = (u) => new Request(u, { cache: 'reload' });

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(async (c) => {
    await c.addAll(CORE.map(fresh));
    await Promise.all(EXTRA.map((u) => c.add(fresh(u)).catch(() => {})));
  }));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('mist-guild-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', (e) => { if (e.data === 'skip-waiting') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith(API)) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await c.match('./') : undefined);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') c.put(req, res.clone()).catch(() => {});
    return res;
  }));
});
