// 匿名使用統計的核心：檢查送進來的東西、存起來、算出總表。
// 不碰網路、不認得 Cloudflare，所以測試可以直接拿 SQLite 跑（core.test.ts）。
//
// 存的東西只有這些：隨機的裝置代號、哪一版、手機還是電腦、哪一張委託、做到第幾段、分數、花了多久。
// 不存 IP、不存瀏覽器的字串、不存任何文字輸入。

export type Value = string | number | null;
/** 跑一句 SQL，回傳每一列 */
export type Exec = (sql: string, ...params: Value[]) => Record<string, Value>[];

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS events (
     id INTEGER PRIMARY KEY, at INTEGER NOT NULL, day TEXT NOT NULL, device TEXT NOT NULL, build TEXT NOT NULL, pf TEXT NOT NULL, pwa INTEGER NOT NULL,
     type TEXT NOT NULL, case_id TEXT NOT NULL DEFAULT '', tier INTEGER, phase INTEGER, score INTEGER, safety TEXT, secs INTEGER, gtime INTEGER, hints INTEGER, found INTEGER, plays INTEGER)`,
  // 同一件事重送（網路斷掉、沒收到回覆）不會算兩次
  'CREATE UNIQUE INDEX IF NOT EXISTS events_once ON events (device, at, type, case_id)',
  'CREATE INDEX IF NOT EXISTS events_day ON events (day)',
];

/** open：打開遊戲（一天一次）。start：接了一張委託。leave：做到一半回公會。drop：放掉那一張。done：結案並看完回顧 */
export const TYPES = ['open', 'start', 'leave', 'drop', 'done'] as const;
const PLATFORMS = ['ios', 'android', 'desktop', 'other'];
const SAFETY = ['met', 'late', 'review'];

export interface Row {
  at: number; day: string; device: string; build: string; pf: string; pwa: number; type: string; case_id: string;
  tier: number | null; phase: number | null; score: number | null; safety: string | null; secs: number | null; gtime: number | null; hints: number | null; found: number | null; plays: number | null;
}

/** 一個裝置一天最多收幾筆、全部一天最多收幾筆。超過的丟掉：擋灌水，也保護免費額度 */
export const CAP = { perDevice: 400, perDay: 50_000, perRequest: 50 };

/** 台北時間的日期 */
export const dayOf = (at: number) => new Date((at + 8 * 3600) * 1000).toISOString().slice(0, 10);
const int = (x: unknown, lo: number, hi: number): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi ? Math.round(x) : null);

/** 把送進來的一包檢查過、整理成要存的列。整包不對回傳 null；個別不對的事件略過 */
export function parse(body: unknown, now: number): Row[] | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (b.v !== 1 || typeof b.d !== 'string' || !/^[0-9a-f]{16}$/.test(b.d) || !Array.isArray(b.e)) return null;
  const build = typeof b.b === 'string' && /^[\w.-]{1,40}$/.test(b.b) ? b.b : 'unknown';
  const pf = typeof b.pf === 'string' && PLATFORMS.includes(b.pf) ? b.pf : 'other';
  const rows: Row[] = [];
  for (const raw of b.e.slice(0, CAP.perRequest)) {
    if (!raw || typeof raw !== 'object') continue;
    const e = raw as Record<string, unknown>;
    if (typeof e.t !== 'string' || !(TYPES as readonly string[]).includes(e.t)) continue;
    const case_id = typeof e.c === 'string' && /^c\d{2}[a-z]$/.test(e.c) ? e.c : '';
    if (e.t !== 'open' && !case_id) continue;
    // 離線的時候事件會先留在裝置上，所以時間用裝置記的；差太多（超過 45 天、或是未來）就用收到的時間
    const at = int(e.at, now - 45 * 86400, now + 86400) ?? now;
    rows.push({ at, day: dayOf(at), device: b.d, build, pf, pwa: b.pwa === 1 ? 1 : 0, type: e.t, case_id: e.t === 'open' ? '' : case_id,
      tier: int(e.tier, 0, 9), phase: int(e.ph, 1, 4), score: int(e.sc, 0, 100), safety: typeof e.sf === 'string' && SAFETY.includes(e.sf) ? e.sf : null,
      secs: int(e.sec, 0, 86400), gtime: int(e.gt, 0, 86400), hints: int(e.h, 0, 99), found: e.f === 1 ? 1 : e.f === 0 ? 0 : null, plays: int(e.n, 1, 9999) });
  }
  return rows;
}

/** 存進去。回傳真的存了幾筆 */
export function add(exec: Exec, rows: Row[], now: number): number {
  if (!rows.length) return 0;
  const today = dayOf(now), device = rows[0].device;
  const count = (sql: string, ...p: Value[]) => Number(exec(sql, ...p)[0]?.n ?? 0);
  let room = Math.min(CAP.perDevice - count('SELECT COUNT(*) AS n FROM events WHERE device = ? AND day = ?', device, today), CAP.perDay - count('SELECT COUNT(*) AS n FROM events WHERE day = ?', today));
  let saved = 0;
  for (const r of rows) {
    if (room <= 0) break;
    const before = count('SELECT COUNT(*) AS n FROM events');
    exec('INSERT OR IGNORE INTO events (at, day, device, build, pf, pwa, type, case_id, tier, phase, score, safety, secs, gtime, hints, found, plays) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      r.at, r.day, r.device, r.build, r.pf, r.pwa, r.type, r.case_id, r.tier, r.phase, r.score, r.safety, r.secs, r.gtime, r.hints, r.found, r.plays);
    if (count('SELECT COUNT(*) AS n FROM events') > before) { saved++; room--; }
  }
  return saved;
}

export interface Summary {
  since: string | null; until: string;
  /** devices：出現過的裝置。finishers：至少結案一張的裝置。returning：在兩天以上出現過的裝置。installed：從主畫面圖示開過的裝置 */
  totals: { devices: number; finishers: number; returning: number; installed: number; opens: number; starts: number; dones: number; leaves: number; drops: number };
  days: { day: string; devices: number; starts: number; dones: number }[];
  /** starters、finishers 是裝置數。firstScore：第一次結案的平均分數。stuck：做到一半離開或放掉的時候，停在第幾段 */
  cases: { case_id: string; starts: number; dones: number; starters: number; finishers: number; firstScore: number | null; score: number | null; met: number; late: number; review: number; found: number; secs: number | null; hints: number | null; stuck: [number, number, number, number] }[];
  platforms: { pf: string; devices: number }[];
  builds: { build: string; devices: number; last: string }[];
  /** 每個裝置結案了幾張不同的委託，分成幾組 */
  depth: { label: string; devices: number }[];
}

const num = (x: Value | undefined) => Number(x ?? 0);
const avg = (x: Value | undefined) => (x === null || x === undefined ? null : Math.round(Number(x) * 10) / 10);

/** 總表。days：只看最近幾天（含今天）；null 是全部 */
export function summary(exec: Exec, days: number | null, now: number): Summary {
  const until = dayOf(now), since = days ? dayOf(now - (days - 1) * 86400) : null, from = since ?? '0000-00-00';
  const one = (sql: string, ...p: Value[]) => exec(sql, ...p)[0] ?? {};
  const t = one(`SELECT COUNT(DISTINCT device) AS devices, COUNT(DISTINCT CASE WHEN type = 'done' THEN device END) AS finishers, COUNT(DISTINCT CASE WHEN pwa = 1 THEN device END) AS installed,
    SUM(type = 'open') AS opens, SUM(type = 'start') AS starts, SUM(type = 'done') AS dones, SUM(type = 'leave') AS leaves, SUM(type = 'drop') AS drops FROM events WHERE day >= ?`, from);
  const returning = num(one('SELECT COUNT(*) AS n FROM (SELECT device FROM events WHERE day >= ? GROUP BY device HAVING COUNT(DISTINCT day) >= 2)', from).n);
  const cases = exec(`SELECT case_id, SUM(type = 'start') AS starts, SUM(type = 'done') AS dones,
      COUNT(DISTINCT CASE WHEN type = 'start' THEN device END) AS starters, COUNT(DISTINCT CASE WHEN type = 'done' THEN device END) AS finishers,
      AVG(CASE WHEN type = 'done' AND plays = 1 THEN score END) AS firstScore, AVG(CASE WHEN type = 'done' THEN score END) AS score,
      SUM(type = 'done' AND safety = 'met') AS met, SUM(type = 'done' AND safety = 'late') AS late, SUM(type = 'done' AND safety = 'review') AS review, SUM(type = 'done' AND found = 1) AS found,
      AVG(CASE WHEN type = 'done' THEN secs END) AS secs, AVG(CASE WHEN type = 'done' THEN hints END) AS hints,
      SUM(type IN ('leave', 'drop') AND phase = 1) AS s1, SUM(type IN ('leave', 'drop') AND phase = 2) AS s2, SUM(type IN ('leave', 'drop') AND phase = 3) AS s3, SUM(type IN ('leave', 'drop') AND phase = 4) AS s4
    FROM events WHERE day >= ? AND case_id <> '' GROUP BY case_id ORDER BY case_id`, from);
  const depth = one(`SELECT SUM(n = 0) AS d0, SUM(n BETWEEN 1 AND 3) AS d1, SUM(n BETWEEN 4 AND 11) AS d4, SUM(n BETWEEN 12 AND 19) AS d12, SUM(n BETWEEN 20 AND 47) AS d20, SUM(n >= 48) AS d48
    FROM (SELECT COUNT(DISTINCT CASE WHEN type = 'done' THEN case_id END) AS n FROM events WHERE day >= ? GROUP BY device)`, from);
  return {
    since, until,
    totals: { devices: num(t.devices), finishers: num(t.finishers), returning, installed: num(t.installed), opens: num(t.opens), starts: num(t.starts), dones: num(t.dones), leaves: num(t.leaves), drops: num(t.drops) },
    days: exec("SELECT day, COUNT(DISTINCT device) AS devices, SUM(type = 'start') AS starts, SUM(type = 'done') AS dones FROM events WHERE day >= ? GROUP BY day ORDER BY day DESC LIMIT 120", from)
      .map((r) => ({ day: String(r.day), devices: num(r.devices), starts: num(r.starts), dones: num(r.dones) })),
    cases: cases.map((r) => ({ case_id: String(r.case_id), starts: num(r.starts), dones: num(r.dones), starters: num(r.starters), finishers: num(r.finishers), firstScore: avg(r.firstScore), score: avg(r.score),
      met: num(r.met), late: num(r.late), review: num(r.review), found: num(r.found), secs: avg(r.secs), hints: avg(r.hints), stuck: [num(r.s1), num(r.s2), num(r.s3), num(r.s4)] })),
    platforms: exec('SELECT pf, COUNT(DISTINCT device) AS devices FROM events WHERE day >= ? GROUP BY pf ORDER BY devices DESC, pf', from).map((r) => ({ pf: String(r.pf), devices: num(r.devices) })),
    builds: exec('SELECT build, COUNT(DISTINCT device) AS devices, MAX(day) AS last FROM events WHERE day >= ? GROUP BY build ORDER BY last DESC, devices DESC LIMIT 20', from).map((r) => ({ build: String(r.build), devices: num(r.devices), last: String(r.last) })),
    depth: [['還沒結案過', depth.d0], ['結案 1 到 3 張', depth.d1], ['結案 4 到 11 張', depth.d4], ['結案 12 到 19 張', depth.d12], ['結案 20 到 47 張', depth.d20], ['48 張全部結案', depth.d48]].map(([label, n]) => ({ label: String(label), devices: num(n as Value) })),
  };
}

const COLUMNS = ['at', 'day', 'device', 'build', 'pf', 'pwa', 'type', 'case_id', 'tier', 'phase', 'score', 'safety', 'secs', 'gtime', 'hints', 'found', 'plays'];
/** 每一筆事件一列的 CSV，給試算表或統計軟體用。最多 20 萬列 */
export function csv(exec: Exec, days: number | null, now: number): string {
  const from = days ? dayOf(now - (days - 1) * 86400) : '0000-00-00';
  const rows = exec(`SELECT ${COLUMNS.join(', ')} FROM events WHERE day >= ? ORDER BY id LIMIT 200000`, from);
  return [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((k) => (r[k] === null || r[k] === undefined ? '' : String(r[k]))).join(','))].join('\n') + '\n';
}
