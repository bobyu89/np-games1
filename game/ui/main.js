// 畫面：標題、選關、對戰、結果、圖鑑。規則都在 core/，這裡只負責顯示和接收操作。

import { RULES, MODE_NAMES } from '../core/rules.js';
import {
  createGame, perform, interviewMenu, examMenu, diagnosisGate, candidateList, workupMenu, mainDiagnosis, systemName,
} from '../core/engine.js';
import { scoreGame, reviewGame } from '../core/scoring.js';
import { loadData } from './data.js';
import { loadStore, saveStore, recordRun } from './store.js';
import { drawScene, drawMonster } from './scene.js';

const root = document.getElementById('app');
const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const app = {
  data: null,
  store: null,
  view: 'title',      // title | select | game | result | dex | help
  specialty: 'im',
  game: null,
  score: null,
  review: null,
  menu: { path: 'intro' },
  msg: [],
  pick: null,         // 正在勾選的系統和診斷
  fx: { flash: false, hurt: false, veil: null },
  W: 160,
};
let refs = null;      // 對戰畫面上會一直更新的元素

// ───────── 小工具 ─────────

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v === true) n.setAttribute(k, '');
    else n.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) if (kid !== null && kid !== undefined && kid !== false) n.append(kid);
  return n;
}

function cmd(label, onclick, o = {}) {
  const kids = [];
  if (o.tag !== undefined) kids.push(el('span', { class: 'tag', text: o.tag }));
  kids.push(label);
  if (o.sub) kids.push(el('span', { class: 'sub', text: o.sub }));
  return el('button', {
    type: 'button',
    class: 'box cmd' + (o.center ? ' center' : '') + (o.done ? ' done' : '') + (o.primary ? ' primary' : ''),
    onclick,
    disabled: o.disabled,
    'aria-pressed': o.pressed === undefined ? undefined : String(o.pressed),
  }, kids);
}
const grid = (cols, ...kids) => el('div', { class: 'grid c' + cols }, kids);
const line = (cls, text) => ({ cls, text });
const say = (...lines) => { app.msg = lines.flat().filter(Boolean); };

// 依螢幕大小決定放大倍數和畫面寬度：盡量用整數倍，像素才會銳利
function fit() {
  const cs = getComputedStyle(document.body);
  const availW = document.body.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const availH = document.body.clientHeight > 100 ? document.body.clientHeight : window.innerHeight;
  let u = 1;
  // 高度至少留 320 個邏輯像素，訊息和選單才放得下；螢幕矮就改用 1.5 倍
  for (const s of [4, 3, 2, 1.5]) if (160 * s <= availW && (s <= 1.5 ? 284 : 320) * s <= availH) { u = s; break; }
  app.W = Math.max(160, Math.min(200, Math.floor(availW / u)));
  root.style.setProperty('--u', u + 'px');
  root.style.setProperty('--w', String(app.W));
}

function sceneBlock(state) {
  const canvas = el('canvas', { class: 'pixel', 'aria-hidden': 'true' });
  drawScene(canvas, app.W, state);
  return el('div', { class: 'scene' }, canvas);
}

function go(view) {
  app.view = view;
  render();
}

function render() {
  fit();
  const views = { title: viewTitle, select: viewSelect, game: viewGame, result: viewResult, dex: viewDex, help: viewHelp };
  root.replaceChildren(views[app.view]());
}

// ───────── 標題、說明 ─────────

function viewTitle() {
  return el('div', { class: 'page' },
    sceneBlock({ veil: 100, monster: 'angry-heart', mood: 'pain' }),
    el('div', { class: 'box title-box' },
      el('h1', { text: '揭開主訴' }),
      el('p', { text: 'NP OSCE 回合制推理' }),
      el('p', { class: 'small', text: '示範版：一個關卡' })),
    cmd('開始', () => go('select'), { center: true, primary: true }),
    grid(2,
      cmd('圖鑑', () => go('dex'), { center: true }),
      cmd('怎麼玩', () => go('help'), { center: true })),
    el('p', { class: 'small', text: '教學用的簡化模型，不能取代臨床判斷和院內規範。' }));
}

function viewHelp() {
  const items = [
    '每一關是一個主訴。它被面紗蓋住，你要一步一步把它揭開。',
    '主訴每回合都會讓病人掉血。',
    '問對問題、做對身體評估，面紗會變薄，病人會回血。',
    '問診有 13 個面向：現在病史 8 項（LQQOPERA）、過去病史 4 項、系統回顧。第一次問都算問對。',
    '有些面向可以追問。關鍵線索常藏在追問裡，但問不到東西會白白過一回合。',
    '重複問、做和主訴無關的評估、開不必要的檢查，都不會回血。',
    '線索夠了就下診斷。診斷正確，面紗全開。',
    '最後開檢查檢驗來確認診斷。必要的都開了，病人就康復。',
    '血量歸零：病況惡化，這一關失敗。',
  ];
  return el('div', { class: 'page' },
    el('div', { class: 'box' }, el('h2', { text: '怎麼玩' }), el('ul', {}, items.map((t) => el('li', { text: '・' + t })))),
    el('div', { class: 'box' },
      el('h2', { text: '兩種模式' }),
      el('p', { text: '練習：掉血比較慢，有燈號和提示，診斷錯了可以再試。13 個面向都問過才能下診斷。' }),
      el('p', { text: 'OSCE：沒有燈號和提示，診斷只有一次機會，結束才看回饋。' })),
    el('div', { class: 'box' },
      el('p', { class: 'small', text: '回血是遊戲的比喻，代表你離正確的處置越來越近。實際上問診本身不會讓病人好起來。' })),
    cmd('返回', () => go('title'), { center: true }));
}

// ───────── 選關 ─────────

function starText(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }

function viewSelect() {
  const tax = app.data.taxonomy;
  const mode = app.store.mode;
  const setMode = (m) => { app.store.mode = m; saveStore(app.store); render(); };
  const cases = app.data.cases.filter((c) => c.specialty === app.specialty);
  const list = [];
  if (cases.length === 0) list.push(el('div', { class: 'box' }, el('p', { class: 'small', text: '這一科還沒有關卡。' })));
  for (const sys of tax.systems) {
    const inSys = cases.filter((c) => c.systems[0] === sys.id);
    if (!inSys.length) continue;
    list.push(el('p', { class: 'small', text: '▼ ' + sys.name }));
    for (const c of inSys) {
      const rec = (app.store.cases[c.id] || {})[mode];
      const sub = c.difficulty + '・' + c.type + '　' + (rec && rec.wins ? starText(rec.stars) + ' ' + rec.best + ' 分' : '還沒過關')
        + (c.review.state !== '已審查' ? '\n示範內容，還沒經過專家審查' : '');
      const b = cmd(c.chief_complaint, () => startCase(c), { sub });
      b.querySelector('.sub').style.whiteSpace = 'pre-line';
      list.push(b);
    }
  }
  return el('div', { class: 'page' },
    el('div', { class: 'box' },
      el('h2', { text: '選關' }),
      el('p', { class: 'small', text: mode === 'practice' ? '練習：有燈號和提示，診斷可以再試。' : 'OSCE：沒有提示，診斷只有一次機會。' })),
    grid(2,
      cmd('練習', () => setMode('practice'), { center: true, pressed: mode === 'practice' }),
      cmd('OSCE', () => setMode('osce'), { center: true, pressed: mode === 'osce' })),
    grid(2, tax.specialties.map((s) => cmd(s.name, () => { app.specialty = s.id; render(); }, { center: true, pressed: app.specialty === s.id }))),
    list,
    cmd('返回', () => go('title'), { center: true }));
}

function startCase(c) {
  const g = createGame(c, app.data.taxonomy, { mode: app.store.mode });
  app.game = g;
  app.score = null;
  app.review = null;
  app.pick = { systems: new Set(), main: null, diffs: new Set() };
  app.fx = { flash: false, hurt: false, veil: null };
  app.menu = { path: 'intro' };
  say(
    line('sys', c.patient.age + ' 歲' + c.patient.sex + '性，' + c.patient.setting + '。主訴：' + c.chief_complaint + '。'),
    line('pt', '病人：「' + c.patient.opening + '」'),
    line('note', '主訴每回合都會讓病人掉血。問對問題、做對評估，病人才會回血。'));
  go('game');
}

// ───────── 對戰畫面 ─────────

function viewGame() {
  refs = {
    canvas: el('canvas', { class: 'pixel', 'aria-hidden': 'true' }),
    cc: el('span', { class: 'cc' }),
    turn: el('span', { class: 'turn' }),
    hpbar: el('div', { class: 'hpbar', role: 'img' }, el('i')),
    hpnum: el('span', { class: 'hpnum' }),
    veil: el('div', { class: 'veil-tag' }),
    lights: el('div', { class: 'lights' }),
    msg: el('div', { class: 'msg box', 'aria-live': 'polite' }),
    menu: el('div', { class: 'menu' }),
  };
  const frame = refs.frame = el('div', { class: 'game' },
    el('div', { class: 'scene' }, refs.canvas,
      el('div', { class: 'status box' },
        el('div', { class: 'row' }, refs.cc, refs.turn),
        el('div', { class: 'row' }, el('span', { text: '病人' }), refs.hpbar, refs.hpnum)),
      refs.veil),
    refs.lights, refs.msg, refs.menu);
  updateGame();
  return frame;
}

function paintScene() {
  const g = app.game;
  drawScene(refs.canvas, app.W, {
    veil: app.fx.veil === null ? g.veil : app.fx.veil,
    monster: g.case.monster.sprite,
    mood: g.phase === 'won' ? 'ok' : 'pain',
    flash: app.fx.flash,
    hurt: app.fx.hurt,
  });
}

function updateGame() {
  if (!refs || app.view !== 'game') return;
  const g = app.game;
  const practice = g.mode === 'practice';
  const path = app.menu.path;

  refs.cc.textContent = '主訴：' + g.case.chief_complaint;
  refs.turn.textContent = '第' + g.turn + '回合';
  const pct = Math.round((g.hp / g.hpMax) * 100);
  refs.hpbar.firstChild.style.width = pct + '%';
  refs.hpbar.className = 'hpbar' + (pct < 25 ? ' low' : pct < 50 ? ' mid' : '');
  refs.hpbar.setAttribute('aria-label', '病人血量 ' + g.hp + '，滿分 ' + g.hpMax);
  refs.hpnum.textContent = String(g.hp);

  const shownVeil = app.fx.veil === null ? g.veil : app.fx.veil;
  refs.veil.textContent = shownVeil <= 0 ? g.case.monster.name : '面紗' + shownVeil + '%';
  paintScene();

  // 問診燈號：只有練習模式有。看筆記和選診斷的時候先收起來，把空間讓給清單
  const wide = path === 'notes' || path === 'dx';
  refs.lights.hidden = wide || g.phase === 'workup' || g.phase === 'won';
  if (!practice) {
    refs.lights.className = 'lights-off';
    refs.lights.replaceChildren('OSCE 模式：沒有燈號');
  } else {
    refs.lights.className = 'lights';
    const facets = g.tax.facets;
    const cell = (f) => el('div', { class: 'light' + (g.asked[f.id] ? ' on' : ''), title: f.name, text: f.light });
    refs.lights.replaceChildren(
      el('div', { class: 'row r8' }, facets.filter((f) => f.zone === 'hpi').map(cell)),
      el('div', { class: 'row r5' }, facets.filter((f) => f.zone !== 'hpi').map(cell)));
  }

  // 訊息框：對話可以捲動，血量和面紗的變化固定在最下面一行
  refs.msg.hidden = path === 'notes';
  const toP = (m) => el('p', { class: m.cls, text: m.text });
  const body = el('div', { class: 'msg-body' }, app.msg.filter((m) => !m.cls.startsWith('fx')).map(toP));
  const wrap = el('div', { class: 'msg-wrap' }, body);
  const foot = app.msg.filter((m) => m.cls.startsWith('fx')).map(toP);
  refs.msg.replaceChildren(...[wrap, foot.length ? el('div', { class: 'msg-foot' }, foot) : null].filter(Boolean));
  // 還有字沒顯示完的時候，右下角出現 ▼ 提醒可以往下捲
  const more = () => wrap.classList.toggle('more', body.scrollHeight - body.scrollTop > body.clientHeight + 2);
  body.addEventListener('scroll', more, { passive: true });

  refs.frame.className = 'game' + (wide ? ' listing' : '');
  refs.menu.replaceChildren(...buildMenu());
  refs.menu.scrollTop = 0;
  requestAnimationFrame(more);
}

function setMenu(menu, ...lines) {
  app.menu = menu;
  if (lines.length) say(...lines);
  updateGame();
}

function buildMenu() {
  const g = app.game;
  const practice = g.mode === 'practice';
  const m = app.menu;
  const mark = (done) => (practice && done ? '✓ ' : '');
  // 選單最下面固定的一排：清單很長的時候，「返回」和「送出」還是按得到
  const foot = (...kids) => el('div', { class: 'menu-foot' }, kids);
  const back = (to) => foot(cmd('返回', () => setMenu(to), { center: true }));

  switch (m.path) {
    case 'intro':
      return [cmd('開始', () => { perform(g, { type: 'begin' }); setMenu({ path: 'systems' }, line('sys', '先決定方向：這個主訴要評估哪些系統？可以複選。')); }, { center: true, primary: true }),
        cmd('回選關', () => go('select'), { center: true })];

    case 'systems':
      return [
        grid(2, g.tax.systems.map((s) => cmd(s.name, () => {
          if (app.pick.systems.has(s.id)) app.pick.systems.delete(s.id); else app.pick.systems.add(s.id);
          updateGame();
        }, { center: true, pressed: app.pick.systems.has(s.id) }))),
        cmd('確定', confirmSystems, { center: true, primary: true }),
      ];

    case 'root':
      if (g.phase === 'workup') {
        return [
          el('p', { class: 'head', text: '開檢查檢驗（一次一項）' }),
          ...workupMenu(g).map((w) => cmd(w.name, () => act({ type: 'order', test: w.id }), { tag: (w.ordered ? '✓' : '') + w.kind, done: w.ordered, disabled: w.ordered })),
          cmd('線索筆記', () => setMenu({ path: 'notes' }), { center: true }),
        ];
      }
      return [grid(2,
        cmd('問診', () => setMenu({ path: 'ask', zone: m.zone || 'hpi' }), { center: true }),
        cmd('身體評估', () => setMenu({ path: 'exam' }), { center: true }),
        cmd('線索筆記', () => setMenu({ path: 'notes' }), { center: true }),
        cmd('下診斷', openDiagnosis, { center: true }))];

    case 'ask': {
      const zones = interviewMenu(g);
      const zone = zones.find((z) => z.id === m.zone) || zones[0];
      return [
        grid(3, zones.map((z) => cmd(z.name, () => setMenu({ path: 'ask', zone: z.id }), { center: true, pressed: z.id === zone.id }))),
        grid(2, zone.facets.map((f) => cmd(mark(f.asked) + f.name, () => openFacet(f.id), { done: practice && f.asked }))),
        back({ path: 'root', zone: zone.id }),
      ];
    }

    case 'facet': {
      const f = interviewMenu(g).flatMap((z) => z.facets).find((x) => x.id === m.facet);
      const out = [
        el('p', { class: 'head', text: '「' + f.name + '」' }),
        cmd(mark(f.asked) + '問：' + f.ask, () => act({ type: 'ask', facet: f.id }), { done: practice && f.asked }),
      ];
      f.followUps.forEach((fu) => out.push(cmd(mark(fu.asked) + '追問：' + fu.ask, () => act({ type: 'follow_up', facet: f.id, index: fu.index }), { done: practice && fu.asked })));
      out.push(back({ path: 'ask', zone: g.tax.facets.find((x) => x.id === f.id).zone }));
      return out;
    }

    case 'exam': {
      const groups = examMenu(g);
      return [
        el('p', { class: 'head', text: '要評估哪個系統？' }),
        grid(2, groups.map((gr) => {
          const done = gr.items.filter((it) => it.done).length;
          return cmd(gr.system.name, () => setMenu({ path: 'examSystem', system: gr.system.id }), { center: true, sub: practice ? '做了 ' + done + ' 項' : undefined });
        })),
        back({ path: 'root' }),
      ];
    }

    case 'examSystem': {
      const gr = examMenu(g).find((x) => x.system.id === m.system);
      return [
        el('p', { class: 'head', text: '「' + gr.system.name + '」' }),
        ...gr.items.map((it) => cmd(mark(it.done) + it.technique + '｜' + it.site, () => act({ type: 'exam', item: it.id }), { done: practice && it.done })),
        back({ path: 'exam' }),
      ];
    }

    case 'notes':
      return [notesNode(g), back({ path: 'root' })];

    case 'dx': {
      const p = app.pick;
      const submit = () => act({ type: 'diagnose', main: p.main, differentials: [...p.diffs] });
      return [
        ...candidateList(g).map((d) => {
          const tag = p.main === d.id ? '主' : p.diffs.has(d.id) ? '鑑' : '・';
          return cmd(d.name, () => toggleDx(d.id), { tag, pressed: tag !== '・' });
        }),
        foot(
          cmd(practice ? '提出診斷' : '提出診斷（只有一次機會）', submit, { center: true, primary: true, disabled: !p.main }),
          cmd('返回', () => setMenu({ path: 'root' }), { center: true })),
      ];
    }

    case 'end':
      return [cmd(g.phase === 'won' ? '看結果' : '看檢討', () => go('result'), { center: true, primary: true })];

    default:
      return [];
  }
}

function confirmSystems() {
  const g = app.game;
  const out = perform(g, { type: 'select_systems', systems: [...app.pick.systems] });
  if (!out.ok) return setMenu(app.menu, line('note bad', out.message));
  const name = (id) => systemName(g, id);
  const lines = [];
  if (out.feedback) {
    const fb = out.feedback;
    const core = [...fb.coreHit.map((id) => name(id) + ' ✓'), ...fb.coreMissed.map((id) => name(id) + ' ✗')];
    lines.push(line('sys', '核心系統：' + core.join('、')));
    if (fb.coreMissed.length) lines.push(line('note bad', '漏掉的核心系統已經幫你補上。'));
    if (fb.importantMissed.length) lines.push(line('sys', '也值得考慮：' + fb.importantMissed.map(name).join('、')));
    if (fb.extras.length) lines.push(line('sys', '和這個主訴關係不大：' + fb.extras.map(name).join('、')));
    lines.push(line('note', '開始吧。13 個問診面向都問過，才能下診斷。'));
  } else {
    lines.push(line('sys', '系統選好了。'), line('note', '開始吧。主訴每回合都會讓病人掉血。'));
  }
  setMenu({ path: 'root' }, lines);
}

function openFacet(id) {
  const g = app.game;
  const f = g.tax.facets.find((x) => x.id === id);
  const st = g.asked[id];
  const lines = [];
  if (st) {
    const has = (g.case.interview[id].follow_ups || []).length > 0;
    lines.push(line('sys', has ? '「' + f.name + '」問過了。可以追問，但問不到東西會白白過一回合。' : '「' + f.name + '」問過了，沒有可以追問的。'));
  } else {
    lines.push(line('sys', '要問「' + f.name + '」嗎？'));
  }
  setMenu({ path: 'facet', facet: id }, lines);
}

function openDiagnosis() {
  const g = app.game;
  const gate = diagnosisGate(g);
  if (!gate.ok) {
    return setMenu({ path: 'root' },
      line('note bad', '還有 ' + gate.missing.length + ' 個面向沒問到：' + gate.missing.join('、') + '。'),
      line('sys', '練習模式要 13 個面向都問過，才能下診斷。'));
  }
  setMenu({ path: 'dx' },
    line('sys', '點一下選最可能的診斷（主），再點其他的當鑑別診斷（鑑），最多 ' + RULES.maxDifferentials + ' 個。'));
}

function toggleDx(id) {
  const p = app.pick;
  if (p.main === id) p.main = null;
  else if (p.diffs.has(id)) p.diffs.delete(id);
  else if (!p.main) p.main = id;
  else if (p.diffs.size < RULES.maxDifferentials) p.diffs.add(id);
  else say(line('note bad', '鑑別診斷最多選 ' + RULES.maxDifferentials + ' 個。再點一下已選的可以取消。'));
  updateGame();
}

function notesNode(g) {
  const practice = g.mode === 'practice';
  const box = el('div', { class: 'box notes' });
  for (const z of g.tax.zones) {
    box.append(el('h2', { text: '【' + z.name + '】' }));
    const ul = el('ul');
    const clues = g.clues.filter((c) => c.kind === 'interview' && c.zone === z.id);
    clues.forEach((c) => ul.append(el('li', {}, el('span', { class: 'k', text: c.label + '：' }), c.text, practice && c.key ? el('span', { class: 'star', text: ' ★' }) : null)));
    if (!clues.length) ul.append(el('li', { class: 'none', text: '（還沒有線索）' }));
    if (practice) {
      const miss = g.tax.facets.filter((f) => f.zone === z.id && !g.asked[f.id]).map((f) => f.name);
      if (miss.length) ul.append(el('li', { class: 'none', text: '還沒問：' + miss.join('、') }));
    }
    box.append(ul);
  }
  box.append(el('h2', { text: '【身體評估】' }));
  const ul = el('ul');
  for (const e of g.exams) {
    const def = g.tax.exam_items.find((x) => x.id === e.item);
    const found = g.case.physical_exam.find((p) => p.item === e.item);
    ul.append(el('li', {},
      el('span', { class: 'k', text: systemName(g, e.system) + '・' + def.technique + '｜' + def.site + '：' }),
      found ? found.finding : def.normal,
      practice && e.key ? el('span', { class: 'star', text: ' ★' }) : null));
  }
  if (!g.exams.length) ul.append(el('li', { class: 'none', text: '（還沒有做）' }));
  box.append(ul);
  return box;
}

// 執行一步，把結果寫成訊息，並更新畫面
function act(action) {
  const g = app.game;
  const veilBefore = g.veil;
  const out = perform(g, action);
  if (!out.ok) {
    say(line('note bad', out.message));
    updateGame();
    return;
  }
  say(describe(g, out));
  if (out.type === 'diagnose') {
    app.pick.main = null;
    app.menu = { path: 'root' };
  }
  if (g.phase === 'won' || g.phase === 'lost') finish();
  animate(out, veilBefore);
  updateGame();
}

function describe(g, out) {
  const practice = g.mode === 'practice';
  const has = (t) => out.tags.includes(t);
  const lines = [];
  for (const l of out.lines) {
    if (l.who === 'you') lines.push(line('you', '你：' + l.text));
    else if (l.who === 'patient') lines.push(line('pt', l.text.includes('\n') ? '病人：\n' + l.text : '病人：「' + l.text + '」'));
    else lines.push(line('find', l.text));
  }

  if (out.type === 'diagnose') {
    if (out.correct) {
      lines.push(line('note', '面紗全開！主訴的真面目是「' + g.case.monster.name + '」：' + mainDiagnosis(g).name + '。'));
      lines.push(line('sys', '接著開檢查檢驗來確認診斷。必要的都開了，病人才會康復。'));
    } else if (g.phase !== 'lost') {
      lines.push(line('note bad', '這個診斷不對，病人的狀況變差了。回頭再找線索，然後再提一次。'));
    }
  } else if (practice) {
    // 練習模式才有即時的提示；OSCE 只看得到病人的回答和血量變化
    if (has('key')) lines.push(line('note', '關鍵線索！'));
    if (has('zone')) lines.push(line('note', '「' + out.zone + '」問齊了，額外回血。'));
    if (has('repeat')) lines.push(line('note bad', '這個已經做過了，白白過了一回合。'));
    else if (has('empty')) lines.push(line('note bad', '沒有問到新線索，白白過了一回合。'));
    else if (out.type === 'exam' && has('wasted')) lines.push(line('note bad', '這一項和主訴關係不大，白白過了一回合。'));
    else if (out.type === 'order' && has('wasted')) lines.push(line('note bad', '這一項不必要，白白過了一回合。'));
    if (has('out_of_order')) {
      const def = g.tax.exam_items.find((x) => x.id === g.exams[g.exams.length - 1].item);
      const order = g.tax.exam_order[def.system] || g.tax.exam_order.default;
      lines.push(line('note bad', '順序提醒：這個系統建議 ' + order.join('→') + '。'));
    }
  }

  const fx = [];
  if (out.veilDrop > 0) fx.push('面紗 −' + out.veilDrop);
  if (out.heal > 0) fx.push('回血 +' + out.heal);
  if (out.heal < 0) fx.push('扣血 −' + -out.heal);
  if (out.heal === 0 && out.type !== 'diagnose') fx.push('回血 +0');
  if (out.drain > 0) fx.push('掉血 −' + out.drain);
  if (fx.length) lines.push(line(out.heal <= 0 ? 'fx bad' : 'fx', fx.join('　')));

  if (has('recovered')) lines.push(line('note', '必要的檢查檢驗都開了，診斷確認。病人康復！'));
  if (g.phase === 'lost') lines.push(line('note bad', g.lost === 'diagnosis' ? '診斷不正確。OSCE 只有一次機會，這一關沒有過。' : '病況惡化，這一關失敗。'));
  return lines;
}

function finish() {
  const g = app.game;
  app.score = scoreGame(g);
  app.review = reviewGame(g);
  recordRun(app.store, g, app.score);
  app.menu = { path: 'end' };
}

// 小動畫：得到線索時主訴怪閃一下，掉血時病人閃一下，診斷正確時面紗一層一層揭開
function animate(out, veilBefore) {
  if (reducedMotion()) return;
  const g = app.game;
  const alive = () => app.game === g && app.view === 'game' && refs;
  const later = (ms, fn) => setTimeout(() => { if (alive()) fn(); }, ms);

  if (out.tags.includes('reveal')) {
    const steps = [veilBefore, 50, 30, 10, 1].filter((v) => v <= veilBefore);
    steps.forEach((v, i) => later(i * 150, () => { app.fx.veil = v; refs.veil.textContent = '面紗' + v + '%'; paintScene(); }));
    later(steps.length * 150, () => { app.fx.veil = null; refs.veil.textContent = g.case.monster.name; paintScene(); });
    app.fx.veil = veilBefore;
    return;
  }
  if (out.veilDrop > 0) {
    app.fx.flash = true;
    later(110, () => { app.fx.flash = false; paintScene(); });
  }
  if (out.drain > 0 || out.heal < 0) {
    later(220, () => { app.fx.hurt = true; paintScene(); });
    later(380, () => { app.fx.hurt = false; paintScene(); });
  }
}

// ───────── 結果和檢討 ─────────

function section(title, ...kids) {
  return el('div', { class: 'box' }, el('h2', { text: title }), kids);
}
const tick = (ok) => el('span', { class: ok ? 'ok' : 'no', text: ok ? '✓ ' : '✗ ' });

function viewResult() {
  const g = app.game, s = app.score, r = app.review, c = g.case;
  const won = s.won;
  const headline = won ? '病人康復！' : g.lost === 'diagnosis' ? '診斷不正確，這一關沒有過' : '病況惡化，這一關失敗';
  const page = el('div', { class: 'page' });

  page.append(
    sceneBlock({ veil: won ? 0 : g.veil, monster: c.monster.sprite, mood: won ? 'ok' : 'pain' }),
    el('div', { class: 'box title-box' },
      el('h2', { text: headline }),
      won ? el('p', { class: 'stars' }, '★'.repeat(s.stars), el('span', { class: 'off', text: '★'.repeat(3 - s.stars) })) : null,
      el('p', { text: MODE_NAMES[g.mode] + '模式　總分 ' + s.total }),
      el('p', { class: 'small', text: '用了 ' + g.turn + ' 回合' + (won ? '，康復時血量 ' + g.hp : '') })),
    grid(2,
      cmd(won ? '再玩一次' : '再試一次', () => startCase(c), { center: true, primary: true }),
      cmd('回選關', () => go('select'), { center: true })));

  page.append(section('分數', s.axes.map((a) => el('p', { class: 'score-row' }, el('span', { text: a.name }), el('span', { text: a.points + ' / ' + a.max })))));

  if (won) {
    page.append(section('診斷',
      el('p', {}, el('span', { class: 'gold', text: c.monster.name + '：' }), r.main.name),
      c.teaching.confirmed ? el('p', { text: '檢查確認：' + c.teaching.confirmed }) : null,
      el('p', { class: 'small', text: r.main.note }),
      r.attempts.length > 1 ? el('p', { class: 'small', text: '你提了 ' + r.attempts.length + ' 次才對。' }) : null));

    page.append(section('這個診斷靠哪些線索',
      el('ul', {}, r.main.supportedBy.map((x) => el('li', {}, tick(x.found), el('span', { class: 'small', text: x.label + '：' }), x.text))),
      r.main.supportedBy.some((x) => !x.found) ? el('p', { class: 'small', text: '✗ 是你這一局沒有找到的線索。' }) : null));

    page.append(section('鑑別診斷',
      el('ul', {}, r.differential.map((d) => el('li', {},
        el('span', { class: d.role === '干擾' ? 'no' : 'gold', text: '〔' + d.role + '〕' }), d.name + (d.chosen ? '（你有選）' : ''),
        el('p', { class: 'small', text: d.note }))))));

    page.append(section('檢查檢驗',
      el('ul', {}, r.workup.map((w) => el('li', {},
        el('span', { class: w.role === '不必要' ? 'no' : 'gold', text: '〔' + w.role + '〕' }), w.name + (w.ordered ? '（你有開）' : ''),
        el('p', { class: 'small', text: (w.result && w.role !== '不必要' ? '結果：' + w.result + '\n' : '') + w.note }))))));
    page.querySelectorAll('.small').forEach((n) => { n.style.whiteSpace = 'pre-line'; });
  }

  // 過程的檢討：過關和失敗都看得到
  const sys = r.systems;
  page.append(section('系統選擇',
    el('p', {}, '核心：', sys.core.map((x) => [tick(x.picked), x.name + '　'])),
    sys.important.length ? el('p', {}, '重要：', sys.important.map((x) => [tick(x.picked), x.name + '　'])) : null,
    sys.extras.length ? el('p', { class: 'small', text: '關係不大：' + sys.extras.join('、') }) : null));

  const keyAsked = r.keyFollowUps.filter((k) => k.asked).length;
  page.append(section('問診',
    el('p', {}, tick(r.missedFacets.length === 0), '13 個面向問了 ' + (13 - r.missedFacets.length) + ' 個'),
    r.missedFacets.length ? el('p', { class: 'small', text: '沒問到：' + r.missedFacets.join('、') }) : null,
    el('p', {}, tick(keyAsked === r.keyFollowUps.length), '關鍵追問問到 ' + keyAsked + ' / ' + r.keyFollowUps.length),
    won ? el('ul', {}, r.keyFollowUps.map((k) => el('li', { class: 'small' }, tick(k.asked), k.facet + '：' + k.ask + ' → ' + k.answer))) : null));

  const peDone = r.exams.filter((e) => e.done).length;
  page.append(section('身體評估',
    el('p', {}, tick(peDone === r.exams.length), '和主訴相關的項目做了 ' + peDone + ' / ' + r.exams.length),
    won ? el('ul', {}, r.exams.filter((e) => !e.done).map((e) => el('li', { class: 'small', text: '沒做：' + e.system + '・' + e.label + ' → ' + e.finding }))) : null,
    r.orderViolations.length
      ? el('p', { class: 'small', text: '順序可以更好（一般是視診→觸診→叩診→聽診，腹部是視診→聽診→叩診→觸診）：' + r.orderViolations.join('、') })
      : null));

  page.append(section('白白過掉的回合',
    r.wasted.length
      ? el('ul', {}, r.wasted.map((w) => el('li', { class: 'small', text: '第 ' + w.turn + ' 回合：' + w.text })))
      : el('p', { class: 'ok', text: '沒有。每一回合都有用。' })));

  if (won) {
    page.append(section('教學重點', el('ul', {}, c.teaching.points.map((p) => el('li', { text: '・' + p })))));
    page.append(section('出處', el('ul', {}, c.teaching.sources.map((src) => el('li', { class: 'small' }, src.cite + ' ',
      src.doi ? el('a', { href: 'https://doi.org/' + src.doi, target: '_blank', rel: 'noopener', text: 'https://doi.org/' + src.doi }) : null)))));
  } else {
    page.append(el('div', { class: 'box' }, el('p', { class: 'small', text: '診斷、線索的解說和教學重點，過關之後才會公布。' })));
  }

  page.append(el('div', { class: 'box' },
    el('p', { class: 'small', text: '回血是遊戲的比喻，代表你離正確的處置越來越近。實際上問診本身不會讓病人好起來。確認診斷之後的治療和處置，這一版還沒有做。' }),
    c.review.state !== '已審查' ? el('p', { class: 'small', text: c.review.note }) : null));
  page.append(cmd('回選關', () => go('select'), { center: true }));
  return page;
}

// ───────── 圖鑑 ─────────

function viewDex() {
  const page = el('div', { class: 'page' }, el('div', { class: 'box' },
    el('h2', { text: '圖鑑' }),
    el('p', { class: 'small', text: '過關之後，那個診斷的真面目會收進這裡。已收集 ' + app.store.dex.length + ' / ' + app.data.cases.length })));
  for (const c of app.data.cases) {
    const got = app.store.dex.includes(c.id);
    const canvas = el('canvas', { 'aria-hidden': 'true' });
    drawMonster(canvas, c.monster.sprite, got ? 0 : 100);
    const main = c.differential.find((d) => d.role === '主診斷');
    page.append(el('div', { class: 'box dex-entry' }, canvas,
      got
        ? el('div', {},
          el('p', { class: 'gold', text: c.monster.name }),
          el('p', { text: main.name }),
          el('p', { class: 'small', text: '主訴：' + c.chief_complaint }),
          el('ul', {}, c.teaching.points.map((p) => el('li', { class: 'small', text: '・' + p }))))
        : el('div', {},
          el('p', { text: '？？？' }),
          el('p', { class: 'small', text: '主訴：' + c.chief_complaint }),
          el('p', { class: 'small', text: '還沒揭開。' }))));
  }
  page.append(cmd('返回', () => go('title'), { center: true }));
  return page;
}

// ───────── 啟動 ─────────

async function main() {
  app.store = loadStore();
  try {
    app.data = await loadData();
  } catch (e) {
    root.replaceChildren(el('p', { class: 'loading', text: '遊戲資料讀不到。請透過網頁伺服器打開（例如 npx serve game），不要直接點兩下檔案。（' + e.message + '）' }));
    return;
  }
  try { await document.fonts.load('12px "Fusion Pixel 12"', '揭開主訴'); } catch (e) { /* 沒有像素字體就用系統字 */ }
  let timer = null;
  window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(render, 120); });
  render();
}

main();
