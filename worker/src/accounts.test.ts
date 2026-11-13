import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import type { Exec, Value } from './core.ts';
import { ACCOUNT_SCHEMA, LIMIT, accountId, begin, checkClaims, checkSave, counts, finish, pepperOf, random, readSave, remove, sha256, signIn, signOut, who, writeSave } from './accounts.ts';

const NOW = 1_800_000_000;
function fresh(): Exec {
  const db = new DatabaseSync(':memory:');
  const exec: Exec = (sql, ...p) => db.prepare(sql).all(...p) as Record<string, Value>[];
  ACCOUNT_SCHEMA.forEach((s) => exec(s));
  return exec;
}
const jwt = (claims: object) => 'x.' + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.y';
const SAVE = JSON.stringify({ app: 'mist-guild', kind: 'save', v: 3, at: '2026-11-13T00:00:00.000Z', build: '2026-11-13.abc1234', hero: 'cheng', beats: [], takeaways: [], cases: {} });

test('帳號的代號：同一個人每次一樣；換一家、換一個人、換一個資料庫就不一樣；看不到原本的代號', async () => {
  const a = fresh(), b = fresh(), pa = pepperOf(a);
  assert.equal(pepperOf(a), pa, '那一段亂數產生之後不會變');
  assert.notEqual(pepperOf(b), pa);
  const id = await accountId(pa, 'google', '1234567890');
  assert.equal(await accountId(pa, 'google', '1234567890'), id);
  assert.notEqual(await accountId(pa, 'line', '1234567890'), id);
  assert.notEqual(await accountId(pa, 'google', '1234567891'), id);
  assert.notEqual(await accountId(pepperOf(b), 'google', '1234567890'), id);
  assert.match(id, /^[0-9a-f]{64}$/);
  assert.ok(!id.includes('1234567890'));
});

test('登入到一半的狀態：只能用一次、要同一家、會過期', () => {
  const exec = fresh();
  assert.equal(begin(exec, 'google', 's1', 'n1', NOW), true);
  assert.equal(finish(exec, 'line', 's1', NOW), null, '不是同一家');
  assert.equal(finish(exec, 'google', 's1', NOW), null, '上一行已經把它用掉了');
  begin(exec, 'google', 's2', 'n2', NOW);
  assert.equal(finish(exec, 'google', 's2', NOW + 10), 'n2');
  assert.equal(finish(exec, 'google', 's2', NOW + 11), null, '第二次就沒有了');
  begin(exec, 'line', 's3', 'n3', NOW);
  assert.equal(finish(exec, 'line', 's3', NOW + LIMIT.pendingTtl + 1), null, '過期');
  assert.equal(finish(exec, 'line', 'never', NOW), null);
  // 塞滿的時候讓出最舊的，最新的照樣走得完
  for (let i = 0; i <= LIMIT.pendingMax; i++) begin(exec, 'google', 'flood' + i, 'n', NOW + i % 7);
  assert.equal(Number(exec('SELECT COUNT(*) AS n FROM pending')[0].n), LIMIT.pendingMax);
  begin(exec, 'google', 'latest', 'mine', NOW + 20);
  assert.equal(finish(exec, 'google', 'latest', NOW + 21), 'mine');
});

test('登入、認人、登出；登入狀態只存雜湊，過期就不認', async () => {
  const exec = fresh(), id = await accountId(pepperOf(exec), 'line', 'Uabc'), cookie = random(), hash = await sha256(cookie);
  signIn(exec, id, 'line', hash, NOW);
  assert.deepEqual(who(exec, hash, NOW + 5), { id, provider: 'line', since: NOW });
  assert.equal(who(exec, await sha256('別人猜的'), NOW), null);
  assert.equal(JSON.stringify(exec('SELECT * FROM sessions')).includes(cookie), false, '資料庫裡沒有瀏覽器手上的那一段');
  assert.equal(who(exec, hash, NOW + LIMIT.sessionTtl + 1), null, '過期');
  // 再登入一次：還是同一個帳號，建立的時間不變
  const hash2 = await sha256(random());
  signIn(exec, id, 'line', hash2, NOW + 100);
  assert.equal(who(exec, hash2, NOW + 100)!.since, NOW);
  assert.equal(counts(exec).accounts, 1);
  signOut(exec, hash2);
  assert.equal(who(exec, hash2, NOW + 100), null);
});

test('有在用的登入狀態會往後延；同一個帳號登入太多台，最舊的先登出', async () => {
  const exec = fresh(), id = 'a'.repeat(64), first = await sha256('first');
  signIn(exec, id, 'google', first, NOW);
  const late = NOW + LIMIT.sessionTtl * 0.6;
  assert.ok(who(exec, first, late));
  assert.ok(who(exec, first, NOW + LIMIT.sessionTtl + 1000), '剛才用過，所以延長了');
  for (let i = 0; i < LIMIT.sessionsPerAccount; i++) signIn(exec, id, 'google', await sha256('more' + i), late + 1 + i);
  assert.equal(Number(exec('SELECT COUNT(*) AS n FROM sessions')[0].n), LIMIT.sessionsPerAccount);
  assert.equal(who(exec, first, late + 100), null, '最舊的那一台被登出了');
});

test('雲端的進度：只收遊戲匯出的格式，有大小上限；讀寫和刪除', () => {
  const exec = fresh(), id = 'b'.repeat(64);
  signIn(exec, id, 'google', 'h', NOW);
  assert.deepEqual(readSave(exec, id), { save: null, at: null });
  for (const junk of ['', 'hello', '{}', JSON.stringify({ app: 'other', kind: 'save', v: 3, cases: {} }), JSON.stringify({ app: 'mist-guild', kind: 'save', v: 3 })]) assert.equal(checkSave(junk).ok, false);
  assert.equal(checkSave(JSON.stringify({ app: 'mist-guild', kind: 'save', v: 3, cases: {}, pad: 'x'.repeat(LIMIT.saveBytes) })).ok, false, '太長');
  const check = checkSave(SAVE);
  assert.deepEqual(check, { ok: true, build: '2026-11-13.abc1234' });
  assert.equal(writeSave(exec, id, SAVE, '2026-11-13.abc1234', NOW + 9), NOW + 9);
  assert.deepEqual(readSave(exec, id), { save: SAVE, at: NOW + 9 });
  assert.deepEqual(counts(exec), { accounts: 1, saves: 1, google: 1, line: 0 });
  remove(exec, id);
  assert.deepEqual(readSave(exec, id), { save: null, at: null });
  assert.equal(who(exec, 'h', NOW), null, '刪帳號的時候，登入狀態也一起刪');
  assert.deepEqual(counts(exec), { accounts: 0, saves: 0, google: 0, line: 0 });
});

test('身分憑證：要是給我們的、這一次的、沒過期的', () => {
  const want = { iss: ['https://accounts.google.com', 'accounts.google.com'], aud: 'my-client', nonce: 'n1' };
  const good = { iss: 'https://accounts.google.com', aud: 'my-client', exp: NOW + 600, nonce: 'n1', sub: '1234567890', email: 'someone@example.com', name: '某某' };
  assert.deepEqual(checkClaims(jwt(good), want, NOW), { ok: true, sub: '1234567890' }, '只拿使用者代號，其他的不看也不留');
  assert.deepEqual(checkClaims(jwt({ ...good, aud: ['other', 'my-client'] }), want, NOW), { ok: true, sub: '1234567890' });
  const bad = (change: object, why: string) => assert.deepEqual(checkClaims(jwt({ ...good, ...change }), want, NOW), { ok: false, why });
  bad({ iss: 'https://evil.example' }, 'issuer');
  bad({ aud: 'someone-else' }, 'audience');
  bad({ exp: NOW - 3600 }, 'expired');
  bad({ nonce: 'n2' }, 'nonce');
  bad({ sub: '' }, 'subject');
  bad({ sub: 12345 }, 'subject');
  assert.deepEqual(checkClaims('not-a-token', want, NOW), { ok: false, why: 'unreadable' });
  assert.deepEqual(checkClaims('a.' + Buffer.from('"just a string"').toString('base64url') + '.c', want, NOW), { ok: false, why: 'unreadable' });
});
