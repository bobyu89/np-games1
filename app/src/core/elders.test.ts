// 請教老醫生：不看答案、照他的盲點不提某幾類，回顧那一題問得出他漏了什麼
import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../data/index.ts';
import { ELDERS, ISLANDS, elderOf } from '../data/islands.ts';
import { idealActions, run } from './autoplay.ts';
import { createSession, perform } from './engine.ts';
import { consult, consultQuestion, gaps } from './elders.ts';

test('老醫生的話不看答案：不點名檢查、不點名你沒寫的診斷；同樣的行動換一位病人，說的是同一句', () => {
  for (const e of ELDERS) {
    for (const c of CASES) {
      const acts = idealActions(c);
      for (let i = 0; i <= acts.length; i++) {
        const s = run(c, acts.slice(0, i)), { text } = consult(e, c, s);
        for (const t of c.tests) assert.ok(!text.includes(t.label), e.name + ' 在 ' + c.id + ' 第 ' + i + ' 步點名了檢查「' + t.label + '」');
        for (const f of c.forms) if (text.includes(f.name)) assert.ok(s.board.exclude.includes(f.id), e.name + ' 在 ' + c.id + ' 點名了診斷「' + f.name + '」');
      }
    }
    // 同一個主訴的四位病人，一進門就請教：除了名字，說的話一樣
    for (const group of ['c01', 'c02', 'c05', 'c09']) {
      const four = CASES.filter((c) => c.id.startsWith(group) && c.id.length === 4);
      const said = four.map((c) => consult(e, c, createSession(c)).text.replaceAll(c.patient.name, '某某'));
      assert.equal(new Set(said).size, 1, e.name + ' 對 ' + group + ' 的四位說了不一樣的話');
    }
  }
});

test('每一位都有盲點：他不提的那幾類，就算還沒做，也不會從他嘴裡出現', () => {
  const c = CASES[0], s = createSession(c);
  for (const e of ELDERS) {
    assert.ok(e.never.length >= 3 && e.order.every((g) => !e.never.includes(g)), e.name + '：先提的和不提的不能重疊');
    const r = consult(e, c, s);
    assert.ok(r.record.said === null || !e.never.includes(r.record.said));
    assert.deepEqual(r.record.missed, gaps(c, s).filter((g) => e.never.includes(g)));
    assert.ok(ISLANDS[e.island].elder === e.id);
  }
});

test('請教要花時間；回顧那一題的答案，是他那時候漏的那一項', () => {
  const c = CASES[0];
  let s = createSession(c);
  for (const id of ['q-wash', 'q-intro', 'q-explain']) s = perform(c, s, { type: 'ask', id }).session;
  const before = s.time, ge = elderOf('ge');
  s = perform(c, s, { type: 'hint', by: 'ge' }).session;
  assert.equal(s.time, before + ge.sec);
  assert.equal(s.consults!.length, 1);
  const q = consultQuestion(s)!;
  assert.ok(q, '葛綿不提生命徵象：一進門請教她，一定漏了「量生命徵象」');
  assert.ok(ge.never.includes(q.answer) && q.options.includes(q.answer) && q.options.length === 3);
  // 另外兩個選項，是那時候已經做完的事：選它們一定不對
  for (const o of q.options) if (o !== q.answer) assert.ok(!s.consults![0].open.includes(o));
  // 岑禾不算請教老醫生，回顧不會問
  assert.equal(consultQuestion(perform(c, createSession(c), { type: 'hint' }).session), null);
});
