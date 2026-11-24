import test from 'node:test';
import assert from 'node:assert/strict';
import { ALIASES } from '../data/aliases.ts';
import { COMPLAINTS, CASES } from '../data/index.ts';
import { formsWritten, matchOne, matchWritten, normalize, splitGuesses } from './freetext.ts';

const chest = COMPLAINTS.find((m) => m.id === 'chest-pain')!;

test('同義詞表：每一隻劫影的四個方向都有寫，沒有多寫不存在的方向', () => {
  for (const m of COMPLAINTS) {
    const table = ALIASES[m.id];
    assert.ok(table, m.id + ' 沒有同義詞表');
    assert.deepEqual(Object.keys(table).sort(), m.forms.map((f) => f.id).sort(), m.id + ' 的方向對不上');
    for (const f of m.forms) assert.ok(table[f.id].length >= 3, m.id + '/' + f.id + ' 至少要三個寫法');
  }
});

test('同義詞表：同一隻劫影裡，一個寫法只對到一個方向；每個寫法自己對得到自己', () => {
  for (const m of COMPLAINTS) {
    const seen = new Map<string, string>();
    for (const f of m.forms) for (const a of ALIASES[m.id][f.id]) {
      const k = normalize(a);
      assert.ok(!seen.has(k) || seen.get(k) === f.id, m.id + '：「' + a + '」同時在 ' + seen.get(k) + ' 和 ' + f.id);
      seen.set(k, f.id);
      assert.deepEqual(splitGuesses(a), [a], m.id + '：「' + a + '」會被切開');
      assert.deepEqual(matchOne(a, m.forms, ALIASES[m.id]), [f.id], m.id + '：「' + a + '」應該只對到 ' + f.id);
    }
  }
});

test('每一位病人的真正診斷，用它自己的方向名字或一個寫法都對得到', () => {
  for (const c of CASES) {
    const f = c.forms.find((k) => k.id === c.answer.truth)!;
    assert.deepEqual(formsWritten(c.forms, matchWritten(c.complaint, c.forms, f.name)), [f.id], c.id);
  }
});

test('切開：頓號、逗號、換行、「和」「或」都算；重複的、空的不算；最多八個', () => {
  assert.deepEqual(splitGuesses('心肌梗塞、主動脈剝離\n肺栓塞,  肋軟骨炎'), ['心肌梗塞', '主動脈剝離', '肺栓塞', '肋軟骨炎']);
  assert.deepEqual(splitGuesses('氣胸或肺栓塞和 COPD'), ['氣胸', '肺栓塞', 'COPD']);
  assert.deepEqual(splitGuesses('肺炎、肺炎、 、'), ['肺炎']);
  assert.equal(splitGuesses('a,b,c,d,e,f,g,h,i,j').length, 8);
});

test('比對：英文和縮寫要整個字（MI 不會對到 migraine）；全形、大小寫不影響', () => {
  assert.deepEqual(matchOne('MI', chest.forms, ALIASES['chest-pain']), ['cardiac']);
  assert.deepEqual(matchOne('ＮＳＴＥＭＩ', chest.forms, ALIASES['chest-pain']), ['cardiac']);
  assert.deepEqual(matchOne('Aortic Dissection', chest.forms, ALIASES['chest-pain']), ['vascular']);
  assert.deepEqual(matchOne('pericarditis', chest.forms, ALIASES['chest-pain']), [], '不在四個方向裡的，不硬對');
  const head = COMPLAINTS.find((m) => m.id === 'headache')!;
  assert.deepEqual(matchOne('migraine', head.forms, ALIASES.headache), ['primary']);
  assert.deepEqual(matchOne('mi', head.forms, ALIASES.headache), []);
});

test('比對：長的寫法蓋過包在裡面的短寫法（過敏性紫斑不算過敏）', () => {
  const rash = COMPLAINTS.find((m) => m.id === 'rash')!;
  assert.deepEqual(matchOne('過敏性紫斑', rash.forms, ALIASES.rash), ['bleed']);
  assert.deepEqual(matchOne('藥物過敏', rash.forms, ALIASES.rash), ['allergy']);
  // 一句話裡寫了兩個方向，就兩個都對到
  assert.deepEqual(matchOne('心肌梗塞合併肺栓塞', chest.forms, ALIASES['chest-pain']), ['cardiac', 'vascular']);
});
