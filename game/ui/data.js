// 讀分類表和病例檔。病例先過檢查，沒通過的不放進遊戲。

import { validateCase, validateTaxonomy } from '../core/validate.js';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('讀不到 ' + url + '（' + res.status + '）');
  return res.json();
}

export async function loadData() {
  let raw = globalThis.__NP_GAME_DATA__; // 單一檔案版會把資料直接放在頁面裡
  if (!raw) {
    const base = new URL('../data/', import.meta.url);
    const taxonomy = await getJson(new URL('taxonomy.json', base));
    const index = await getJson(new URL('cases/index.json', base));
    const cases = await Promise.all(index.cases.map((f) => getJson(new URL('cases/' + f, base))));
    raw = { taxonomy, cases };
  }
  const taxCheck = validateTaxonomy(raw.taxonomy);
  if (taxCheck.errors.length) throw new Error('分類表有問題：' + taxCheck.errors.join('；'));
  const cases = [];
  for (const c of raw.cases) {
    const { errors } = validateCase(c, raw.taxonomy);
    if (errors.length) console.error('病例 ' + (c && c.id) + ' 沒通過檢查，先不放進遊戲：', errors);
    else cases.push(c);
  }
  return { taxonomy: raw.taxonomy, cases };
}
