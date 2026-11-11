// 病例檢查工具的測試。執行：node --test game/core/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { validateCase, validateTaxonomy } from './validate.js';

const data = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const readJson = (p) => JSON.parse(readFileSync(join(data, p), 'utf8'));
const tax = readJson('taxonomy.json');
const demo = () => readJson('cases/im-cv-demo-001.json');

test('分類表通過檢查', () => {
  assert.deepEqual(validateTaxonomy(tax).errors, []);
});

test('資料夾裡的每個病例都通過檢查，而且都列在 index.json', () => {
  const index = readJson('cases/index.json');
  const files = readdirSync(join(data, 'cases')).filter((f) => f.endsWith('.json') && f !== 'index.json');
  assert.deepEqual([...index.cases].sort(), files.sort());
  for (const f of files) {
    const c = readJson('cases/' + f);
    assert.deepEqual(validateCase(c, tax).errors, [], f);
    assert.equal(f, c.id + '.json');
  }
});

test('還沒審查的病例會有提醒', () => {
  const { warnings } = validateCase(demo(), tax);
  assert.ok(warnings.some((w) => w.includes('審查')));
});

test('少寫一個問診面向會被抓到', () => {
  const c = demo();
  delete c.interview.family;
  assert.ok(validateCase(c, tax).errors.some((e) => e.includes('家族史')));
});

test('沒有主診斷、沒有危險診斷、沒有必要檢查，都會被抓到', () => {
  const a = demo();
  a.differential.find((d) => d.role === '主診斷').role = '合理鑑別';
  assert.ok(validateCase(a, tax).errors.some((e) => e.includes('主診斷')));

  const b = demo();
  b.differential = b.differential.filter((d) => d.role !== '不能漏掉');
  assert.ok(validateCase(b, tax).errors.some((e) => e.includes('不能漏掉')));

  const c = demo();
  c.workup.forEach((w) => { if (w.role === '必要') w.role = '可開可不開'; });
  assert.ok(validateCase(c, tax).errors.some((e) => e.includes('必要')));
});

test('主診斷指到不存在的線索會被抓到', () => {
  const c = demo();
  c.differential.find((d) => d.role === '主診斷').supported_by.push('interview.onset.9');
  assert.ok(validateCase(c, tax).errors.some((e) => e.includes('找不到的線索')));
});

test('沒有出處會被抓到', () => {
  const c = demo();
  c.teaching.sources = [];
  assert.ok(validateCase(c, tax).errors.some((e) => e.includes('出處')));
});

test('身體評估用了分類表沒有的項目會被抓到', () => {
  const c = demo();
  c.physical_exam.push({ item: 'no-such-item', finding: '…', key: false, weight: 1 });
  assert.ok(validateCase(c, tax).errors.some((e) => e.includes('no-such-item')));
});

test('線索價值壓到最低，照規矩做還是撐得住（第一次問都不吃虧）', () => {
  const c = demo();
  for (const f of Object.values(c.interview)) { f.weight = 1; (f.follow_ups || []).forEach((fu) => { fu.key = false; fu.weight = 0; }); }
  c.differential.find((d) => d.role === '主診斷').supported_by = ['exam.gen-appearance', 'exam.gen-vitals', 'exam.cv-heart'];
  assert.deepEqual(validateCase(c, tax).errors, []);
});
