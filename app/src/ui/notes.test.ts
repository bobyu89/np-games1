import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPLAINTS } from '../data/index.ts';
import { notes } from './notes.ts';

test('速記：十二種主訴都有；每一種四個方向、至少一個不能漏、重點都有出處', () => {
  const list = notes();
  assert.equal(list.length, COMPLAINTS.length);
  for (const n of list) {
    assert.equal(n.forms.length, 4, n.complaint);
    assert.ok(n.forms.some((f) => f.danger), n.complaint);
    assert.ok(n.points.length >= 4, n.complaint + ' 重點太少');
    assert.ok(n.peril, n.complaint + ' 沒有陷阱');
    for (const p of n.points) assert.ok(n.refs[p.ref]?.doi, n.complaint + '：' + p.text);
    assert.equal(new Set(n.points.map((p) => p.text)).size, n.points.length, '重點不重複');
    assert.equal(new Set(n.refs.map((r) => r.id)).size, n.refs.length, '文獻不重複');
  }
});
