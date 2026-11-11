#!/usr/bin/env node
// 病例檢查工具：檢查分類表和每一個病例檔，並自動試玩。
// 用法：node tools/validate-cases.mjs
// 有錯誤時結束碼是 1，可以放進自動檢查。

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateCase, validateTaxonomy } from '../game/core/validate.js';
import { playByTheBook } from '../game/core/autoplay.js';
import { scoreGame } from '../game/core/scoring.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'game', 'data');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

let failed = 0;
const tax = readJson(join(root, 'taxonomy.json'));
const taxResult = validateTaxonomy(tax);
if (taxResult.errors.length) {
  failed += 1;
  console.log('✗ taxonomy.json');
  taxResult.errors.forEach((e) => console.log('    錯誤：' + e));
} else {
  console.log('✓ taxonomy.json');
}

const casesDir = join(root, 'cases');
const index = readJson(join(casesDir, 'index.json'));
const files = readdirSync(casesDir).filter((f) => f.endsWith('.json') && f !== 'index.json').sort();
for (const f of files) if (!index.cases.includes(f)) console.log('  注意：' + f + ' 沒有列在 index.json，遊戲裡看不到');
for (const f of index.cases) if (!files.includes(f)) { failed += 1; console.log('✗ index.json 列了不存在的檔案：' + f); }

if (taxResult.errors.length === 0) {
  const seen = new Set();
  for (const f of files) {
    let c;
    try { c = readJson(join(casesDir, f)); } catch (e) { failed += 1; console.log('✗ ' + f + '\n    錯誤：不是合法的 JSON（' + e.message + '）'); continue; }
    const { errors, warnings } = validateCase(c, tax);
    if (c && c.id) {
      if (seen.has(c.id)) errors.push('id 和別的病例重複：' + c.id);
      seen.add(c.id);
      if (f !== c.id + '.json') errors.push('檔名要和 id 一樣：' + c.id + '.json');
    }
    if (errors.length) {
      failed += 1;
      console.log('✗ ' + f);
      errors.forEach((e) => console.log('    錯誤：' + e));
    } else {
      const lines = ['practice', 'osce'].map((mode) => {
        const g = playByTheBook(c, tax, mode);
        const s = scoreGame(g);
        return (mode === 'osce' ? 'OSCE' : '練習') + ' ' + g.turn + ' 回合、最低血量 ' + g.minHp + '、' + s.total + ' 分';
      });
      console.log('✓ ' + f + '　照規矩試玩：' + lines.join('；'));
    }
    warnings.forEach((w) => console.log('    注意：' + w));
  }
}

console.log(failed ? '\n有 ' + failed + ' 個檔案沒通過。' : '\n全部通過。');
process.exit(failed ? 1 : 0);
