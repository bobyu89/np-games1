// 病例檢查：欄位齊不齊、內容合不合規則，並自動試玩，確認照規矩做的玩家撐得到康復。
// 純邏輯，瀏覽器和 Node 都能用。回傳 { errors, warnings }；errors 是空的才算通過。

import { RULES, DIFFICULTIES, CASE_TYPES, DX_ROLES, WORKUP_ROLES, WORKUP_KINDS, MODES } from './rules.js';
import { scoreGame } from './scoring.js';
import { playByTheBook, playBreadthOnly, playStalling } from './autoplay.js';

export const CASE_FORMAT = 1;
const REVIEW_STATES = ['未審查', '審查中', '已審查'];
const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export function validateCase(c, tax) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  if (!c || typeof c !== 'object') return { errors: ['病例檔不是一個物件'], warnings };
  if (c.format !== CASE_FORMAT) err('format 要是 ' + CASE_FORMAT);
  if (!isText(c.id) || !/^[a-z0-9-]+$/.test(c.id)) err('id 只能用小寫英文、數字和連字號');
  if (!c.review || !REVIEW_STATES.includes(c.review.state)) err('review.state 要是：' + REVIEW_STATES.join('、'));
  else if (c.review.state !== '已審查') warn('這個病例還沒通過臨床專家審查（' + c.review.state + '）');

  const systemIds = tax.systems.map((s) => s.id);
  if (!tax.specialties.some((s) => s.id === c.specialty)) err('specialty 不在分類表裡：' + c.specialty);
  if (!Array.isArray(c.systems) || c.systems.length === 0) err('systems 至少要有一個系統');
  else c.systems.forEach((id) => { if (!systemIds.includes(id)) err('systems 裡有分類表沒有的系統：' + id); });
  if (!DIFFICULTIES.includes(c.difficulty)) err('difficulty 要是：' + DIFFICULTIES.join('、'));
  if (!CASE_TYPES.includes(c.type)) err('type 要是：' + CASE_TYPES.join('、'));
  if (!isText(c.chief_complaint)) err('缺 chief_complaint（主訴）');
  if (!RULES.acuity[c.acuity]) err('acuity 要是：' + Object.keys(RULES.acuity).join('、'));
  if (!c.patient || !isInt(c.patient.age, 0, 120) || !isText(c.patient.sex) || !isText(c.patient.setting)) err('patient 要有 age、sex、setting');
  if (!c.monster || !isText(c.monster.sprite) || !isText(c.monster.name)) err('monster 要有 sprite 和 name');
  if (c.type === '陷阱' && !c.trap) err('陷阱案例要填 trap');

  // 系統選擇
  const sel = c.system_selection || {};
  for (const k of ['core', 'important', 'optional']) {
    if (!Array.isArray(sel[k])) { err('system_selection.' + k + ' 要是陣列'); sel[k] = []; continue; }
    sel[k].forEach((id) => { if (!systemIds.includes(id)) err('system_selection.' + k + ' 裡有分類表沒有的系統：' + id); });
  }
  if (sel.core.length === 0) err('system_selection.core 至少要有一個核心系統');
  const allSel = [...sel.core, ...sel.important, ...sel.optional];
  if (new Set(allSel).size !== allSel.length) err('system_selection 的三組之間有重複的系統');

  // 問診：13 個面向都要寫
  const iv = c.interview || {};
  for (const f of tax.facets) {
    const d = iv[f.id];
    const where = 'interview.' + f.id + '（' + f.name + '）';
    if (!d) { err('缺 ' + where); continue; }
    if (f.id === 'ros') {
      if (!d.by_system || typeof d.by_system !== 'object') err(where + ' 要有 by_system');
      else {
        [...sel.core, ...sel.important].forEach((id) => { if (!isText(d.by_system[id])) err(where + ' 缺少系統的回顧：' + id); });
        Object.keys(d.by_system).forEach((id) => { if (!systemIds.includes(id)) err(where + ' 有分類表沒有的系統：' + id); });
      }
    } else if (!isText(d.answer)) err(where + ' 缺 answer');
    if (!isInt(d.weight, 1, 3)) err(where + ' 的 weight 要是 1 到 3');
    if (d.follow_ups !== undefined && !Array.isArray(d.follow_ups)) { err(where + ' 的 follow_ups 要是陣列'); continue; }
    (d.follow_ups || []).forEach((fu, i) => {
      const w = where + ' 的第 ' + (i + 1) + ' 個追問';
      if (!isText(fu.ask) || !isText(fu.answer)) err(w + ' 要有 ask 和 answer');
      if (!isInt(fu.weight, 0, 3)) err(w + ' 的 weight 要是 0 到 3');
      if (typeof fu.key !== 'boolean') err(w + ' 的 key 要是 true 或 false');
      if (fu.key && fu.weight < 2) err(w + ' 是關鍵線索，weight 至少要 2');
    });
  }
  Object.keys(iv).forEach((id) => { if (!tax.facets.some((f) => f.id === id)) err('interview 裡有分類表沒有的面向：' + id); });

  // 身體評估
  const pe = Array.isArray(c.physical_exam) ? c.physical_exam : [];
  if (pe.length === 0) err('physical_exam 至少要有一項');
  const seenPe = new Set();
  pe.forEach((p, i) => {
    const where = 'physical_exam 第 ' + (i + 1) + ' 項';
    const def = tax.exam_items.find((x) => x.id === p.item);
    if (!def) { err(where + ' 的 item 不在分類表裡：' + p.item); return; }
    if (seenPe.has(p.item)) err(where + ' 重複了：' + p.item);
    seenPe.add(p.item);
    if (!isText(p.finding)) err(where + ' 缺 finding');
    if (!isInt(p.weight, 1, 3)) err(where + ' 的 weight 要是 1 到 3');
    if (typeof p.key !== 'boolean') err(where + ' 的 key 要是 true 或 false');
    if (def.system !== tax.general_system.id && !allSel.includes(def.system)) {
      warn(where + '（' + p.item + '）的系統不在 system_selection 裡，玩家不容易做到');
    }
  });
  if (!pe.some((p) => p.key)) err('physical_exam 至少要有一項關鍵發現');

  // 鑑別診斷
  const dx = Array.isArray(c.differential) ? c.differential : [];
  const ids = new Set();
  dx.forEach((d, i) => {
    const where = 'differential 第 ' + (i + 1) + ' 項';
    if (!isText(d.id) || !isText(d.name)) err(where + ' 要有 id 和 name');
    if (ids.has(d.id)) err(where + ' 的 id 重複：' + d.id);
    ids.add(d.id);
    if (!DX_ROLES.includes(d.role)) err(where + ' 的 role 要是：' + DX_ROLES.join('、'));
    if (!isText(d.note)) err(where + ' 缺 note（為什麼是或不是它）');
  });
  const mains = dx.filter((d) => d.role === '主診斷');
  if (mains.length !== 1) err('differential 要剛好有一個主診斷，現在有 ' + mains.length + ' 個');
  if (!dx.some((d) => d.role === '不能漏掉')) err('differential 至少要有一個「不能漏掉」的診斷');
  if (!dx.some((d) => d.role === '干擾')) err('differential 至少要有一個干擾選項');
  if (dx.length < 4) err('differential 至少要有 4 個候選診斷');
  if (dx.length && dx[0].role === '主診斷') warn('主診斷排在候選清單第一個，玩家容易猜到');
  if (mains.length === 1) {
    const refs = mains[0].supported_by || [];
    if (refs.length < 3) err('主診斷的 supported_by 至少要列 3 條線索');
    let keyRefs = 0;
    refs.forEach((ref) => {
      const r = resolveRef(c, tax, ref);
      if (!r) err('主診斷的 supported_by 有找不到的線索：' + ref);
      else if (r.key) keyRefs += 1;
    });
    if (refs.length && keyRefs === 0) err('主診斷的 supported_by 至少要有一條關鍵線索');
  }

  // 檢查檢驗
  const wu = Array.isArray(c.workup) ? c.workup : [];
  const wids = new Set();
  wu.forEach((w, i) => {
    const where = 'workup 第 ' + (i + 1) + ' 項';
    if (!isText(w.id) || !isText(w.name)) err(where + ' 要有 id 和 name');
    if (wids.has(w.id)) err(where + ' 的 id 重複：' + w.id);
    wids.add(w.id);
    if (!WORKUP_KINDS.includes(w.kind)) err(where + ' 的 kind 要是：' + WORKUP_KINDS.join('、'));
    if (!WORKUP_ROLES.includes(w.role)) err(where + ' 的 role 要是：' + WORKUP_ROLES.join('、'));
    if (w.role !== '不必要' && !isText(w.result)) err(where + ' 缺 result（結果）');
    if (!isText(w.note)) err(where + ' 缺 note（為什麼要開或不用開）');
  });
  if (!wu.some((w) => w.role === '必要')) err('workup 至少要有一項必要的檢查檢驗');
  if (!wu.some((w) => w.role === '不必要')) err('workup 至少要有一項不必要的選項');

  // 教學重點和出處
  const t = c.teaching || {};
  if (!Array.isArray(t.points) || t.points.length === 0 || !t.points.every(isText)) err('teaching.points 至少要有一條教學重點');
  if (!Array.isArray(t.sources) || t.sources.length === 0 || !t.sources.every((s) => s && isText(s.cite))) err('teaching.sources 至少要有一個出處（cite）');

  // 自動試玩。前面有錯就不試，免得錯誤訊息混在一起
  if (errors.length === 0) {
    for (const mode of MODES) {
      const label = mode === 'osce' ? 'OSCE' : '練習';
      try {
        const book = playByTheBook(c, tax, mode);
        if (book.phase !== 'won') err(label + '模式：照規矩做卻沒有康復（結束在 ' + book.phase + '）');
        else {
          if (book.minHp < 30) err(label + '模式：照規矩做，血量最低掉到 ' + book.minHp + '，餘裕太少');
          const s = scoreGame(book);
          if (s.stars < 3) err(label + '模式：照規矩做只拿到 ' + s.stars + ' 顆星（' + s.total + ' 分）');
        }
        const breadth = playBreadthOnly(c, tax, mode);
        if (breadth.phase !== 'won') err(label + '模式：13 個面向問完、診斷和檢查都對，卻沒有康復');
        const stall = playStalling(c, tax, mode);
        if (stall.phase !== 'lost') err(label + '模式：一直重複問同一題卻沒有失敗');
      } catch (e) {
        err(label + '模式的自動試玩出錯：' + e.message);
      }
    }
  }
  return { errors, warnings };
}

function resolveRef(c, tax, ref) {
  const parts = String(ref).split('.');
  if (parts[0] === 'interview') {
    const d = c.interview && c.interview[parts[1]];
    if (!d || !tax.facets.some((f) => f.id === parts[1])) return null;
    if (parts.length === 2) return { key: d.weight >= 3 };
    const fu = (d.follow_ups || [])[Number(parts[2])];
    return fu ? { key: !!fu.key } : null;
  }
  if (parts[0] === 'exam') {
    const p = (c.physical_exam || []).find((x) => x.item === parts.slice(1).join('.'));
    return p ? { key: !!p.key } : null;
  }
  return null;
}

export function validateTaxonomy(tax) {
  const errors = [];
  if (!tax || typeof tax !== 'object') return { errors: ['分類表不是一個物件'], warnings: [] };
  if (!Array.isArray(tax.facets) || tax.facets.length !== 13) errors.push('問診面向要剛好 13 個');
  const zoneIds = (tax.zones || []).map((z) => z.id);
  (tax.facets || []).forEach((f) => { if (!zoneIds.includes(f.zone)) errors.push('面向 ' + f.id + ' 的區不存在：' + f.zone); });
  if (!(tax.facets || []).some((f) => f.id === 'ros')) errors.push('面向裡要有 ros（系統回顧）');
  const sys = [...(tax.systems || []).map((s) => s.id), tax.general_system && tax.general_system.id];
  const seen = new Set();
  (tax.exam_items || []).forEach((x) => {
    if (seen.has(x.id)) errors.push('身體評估項目重複：' + x.id);
    seen.add(x.id);
    if (!sys.includes(x.system)) errors.push('身體評估項目 ' + x.id + ' 的系統不存在：' + x.system);
    if (!isText(x.technique) || !isText(x.site) || !isText(x.normal)) errors.push('身體評估項目 ' + x.id + ' 要有 technique、site、normal');
  });
  return { errors, warnings: [] };
}
