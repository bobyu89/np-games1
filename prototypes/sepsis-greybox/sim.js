/*
 * 《黃金一小時》灰盒原型：純邏輯模擬
 * 不依賴畫面；同樣的 seed 一定得到同樣的結果（debrief 回放與研究數據都靠這點）。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Sim = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ── 可重現的隨機數（mulberry32）。state 就是內部種子，可存檔還原。
  function createRng(seed) {
    let a = seed >>> 0;
    return {
      next() {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      int(n) { return Math.floor(this.next() * n); },
      state() { return a; },
    };
  }

  function unitById(data, id) {
    const u = data.UNITS.find((x) => x.id === id);
    if (!u) throw new Error('Unknown unit: ' + id);
    return u;
  }

  // ── 羈絆：Hour-1 算「不重複 bundle 元素」，職能算「不重複角色」
  function computeTraits(board, data, augments) {
    augments = augments || [];
    const unique = Array.from(new Set(board.filter(Boolean)));
    const defs = unique.map((id) => unitById(data, id));
    const present = new Set();
    defs.forEach((d) => d.bundle.forEach((b) => present.add(b)));
    const bundleIds = data.BUNDLE.map((b) => b.id);
    const presentList = bundleIds.filter((id) => present.has(id));
    const count = presentList.length;
    let tier = 0;
    data.HOUR1_TIERS.forEach((t, i) => { if (count >= t.n) tier = i + 1; });

    const roles = {};
    Object.keys(data.ROLES).forEach((rid) => {
      const r = data.ROLES[rid];
      const offset = rid === 'assessor' && augments.includes('rrt') ? 1 : 0;
      const thresholds = r.tiers.map((t) => t.n - offset);
      const n = defs.filter((d) => d.roles.includes(rid)).length;
      let rt = 0;
      thresholds.forEach((th, i) => { if (n >= th) rt = i + 1; });
      roles[rid] = { count: n, tier: rt, thresholds, active: rt ? r.tiers[rt - 1] : null };
    });

    return {
      bundle: {
        present: presentList,
        missing: bundleIds.filter((id) => !present.has(id)),
        count,
        tier,
      },
      roles,
      physician: defs.some((d) => d.physician),
      attending: unique.includes('attending'),
    };
  }

  // ── 敵人實例
  function expandEnemies(wave, data) {
    const list = [];
    wave.enemies.forEach(([key, n]) => {
      const def = data.ENEMIES[key];
      for (let i = 0; i < n; i++) {
        const hp = def.kind === 'lactate' ? wave.lactateHp : def.hp;
        list.push({
          key, kind: def.kind, name: def.name, hp, maxHp: hp,
          threat: def.threat || 0, growth: def.growth || 0,
        });
      }
    });
    return list;
  }

  function enemyThreat(e) {
    if (e.hp <= 0) return 0;
    if (e.kind === 'lactate') return Math.ceil(e.hp / 3);
    return Math.ceil((e.threat * e.hp) / e.maxHp);
  }

  // 每 COMBAT.pressureEvery 分鐘，還沒處理掉的病理過程持續傷害病人
  function enemyPressure(e) {
    if (e.hp <= 0) return 0;
    if (e.kind === 'lactate') return Math.ceil(e.hp / 12);
    return Math.ceil(e.threat / 6);
  }

  // ── 評估階段 = 偵查
  function evaluateAssessment(wave, toolId, flaggedIds, augments, data) {
    augments = augments || [];
    const flagged = new Set(flaggedIds || []);
    const abnormal = wave.params.filter((p) => p.abnormal).map((p) => p.id);
    const correct = abnormal.filter((id) => flagged.has(id));
    const falseFlags = wave.params.filter((p) => !p.abnormal && flagged.has(p.id)).map((p) => p.id);
    const missed = abnormal.filter((id) => !flagged.has(id));
    const tool = wave.tools[toolId];
    if (!tool) throw new Error('Tool not available this round: ' + toolId);
    const toolBonus = { good: 2, partial: 1, poor: 0 }[tool.quality];
    const total = expandEnemies(wave, data).length;
    const alertBonus = augments.includes('alert') ? 1 : 0;
    const raw = toolBonus + Math.floor(correct.length / 2) - falseFlags.length + alertBonus;
    const reveal = Math.max(0, Math.min(total, raw));
    return {
      tool: toolId,
      quality: tool.quality,
      result: tool.result,
      abnormalTotal: abnormal.length,
      correct, falseFlags, missed,
      reveal, total,
    };
  }

  // ── 自動處置（戰鬥）
  function simulateCombat(opts) {
    const wave = opts.wave;
    const data = opts.data;
    const augments = opts.augments || [];
    const board = opts.board;
    const C = data.COMBAT;
    const rng = createRng(opts.seed == null ? 1 : opts.seed);
    const traits = computeTraits(board, data, augments);
    const enemies = expandEnemies(wave, data);
    const lactate = enemies.find((e) => e.kind === 'lactate') || null;

    const crit = traits.roles.assessor.active ? traits.roles.assessor.active.crit : 0;
    const haste = traits.roles.coordinator.active ? traits.roles.coordinator.active.haste : 0;
    const interPower = traits.roles.interventionist.active ? traits.roles.interventionist.active.power : 0;
    const hour1 = traits.bundle.tier;

    const units = [];
    board.forEach((id, slot) => {
      if (!id) return;
      units.push({ slot, id, def: unitById(data, id), next: C.slotSpacing * (slot + 1), acted: 0 });
    });

    const st = {
      lactateAt: null, cultureAt: null, abxAt: null, fluidAt: null, vasoAt: null,
      sourceAt: null, pharmAt: null, protocolAt: null, protocolBlocked: false,
      resus: false, cultureBonus: false,
    };
    const events = [];
    const frames = [];
    let pressure = 0;

    const alive = (e) => e.hp > 0;
    const targetable = (e) => alive(e) && (e.kind !== 'lactate' || st.lactateAt !== null);
    const firstOf = (kind) => enemies.find((e) => e.kind === kind && targetable(e)) || null;
    const front = () => enemies.find(targetable) || null;

    function hit(unit, enemy, base, tag) {
      if (!enemy || base <= 0) return null;
      let mult = 1;
      if (hour1 >= 1) mult += 0.15;
      if (unit.def.roles.includes('interventionist')) mult += interPower;
      if (hour1 >= 2 && (enemy.kind === 'hypotension' || enemy.kind === 'mods')) mult *= 1.4;
      if (tag === 'abx') {
        if (st.cultureBonus) mult *= 1.5;
        if (st.pharmAt !== null) mult *= 1.25;
        if (augments.includes('asp')) mult *= 1.2;
      }
      let isCrit = false;
      if (crit > 0 && rng.next() < crit) { mult *= 1.5; isCrit = true; }
      const dmg = Math.max(1, Math.round(base * mult));
      enemy.hp = Math.max(0, enemy.hp - dmg);
      return { name: enemy.name, dmg, crit: isCrit, killed: enemy.hp === 0 };
    }

    function say(t, unit, action, hits, kind) {
      events.push({ t, unit: unit ? unit.id : null, slot: unit ? unit.slot : null, action, hits: hits.filter(Boolean), kind: kind || 'action' });
    }

    function act(u, t) {
      const d = u.def;
      const first = u.acted === 0;
      switch (d.skill) {
        case 'measureLactate': {
          if (st.lactateAt === null) st.lactateAt = t;
          if (lactate && alive(lactate)) {
            say(t, u, first ? '量測乳酸：乳酸堆積現形' : '追蹤乳酸', [hit(u, lactate, d.power)]);
          } else {
            say(t, u, '量測乳酸：沒有乳酸堆積', []);
          }
          break;
        }
        case 'fluid': {
          if (st.fluidAt === null) st.fluidAt = t;
          st.resus = true;
          const hits = [];
          const hy = firstOf('hypotension');
          if (hy) hits.push(hit(u, hy, d.power));
          if (lactate && targetable(lactate)) hits.push(hit(u, lactate, 6));
          if (!hy && !(lactate && targetable(lactate))) hits.push(hit(u, firstOf('mods'), Math.round(d.power / 2)));
          say(t, u, '快速輸液（crystalloid）', hits);
          break;
        }
        case 'culture': {
          if (st.cultureAt === null) {
            st.cultureAt = t;
            st.cultureBonus = st.abxAt === null;
            say(t, u, st.cultureBonus ? '抗生素前完成血液培養' : '血液培養（已經在抗生素之後）', [hit(u, firstOf('pathogen'), d.power)]);
          } else {
            say(t, u, '追蹤培養', [hit(u, firstOf('pathogen'), d.power)]);
          }
          break;
        }
        case 'optimize': {
          if (st.pharmAt === null) {
            st.pharmAt = t;
            say(t, u, '劑量優化：抗生素傷害 +25%', [], 'buff');
          }
          break;
        }
        case 'antibiotic': {
          if (st.abxAt === null) st.abxAt = t;
          const hits = enemies.filter((e) => e.kind === 'pathogen' && targetable(e)).map((e) => hit(u, e, d.power, 'abx'));
          const m = firstOf('mods');
          if (m) hits.push(hit(u, m, 4, 'abx'));
          say(t, u, first ? '給第一劑廣效抗生素' : '抗生素', hits);
          break;
        }
        case 'support': {
          say(t, u, '氧療支援', [hit(u, front(), d.power)]);
          break;
        }
        case 'protocol': {
          if (first) {
            if (traits.physician) {
              const pull = traits.attending ? 20 : 15;
              st.protocolAt = t;
              units.forEach((o) => {
                if (o !== u && o.next > t) o.next = Math.max(t + C.step, o.next - pull);
              });
              say(t, u, '預立特定醫療流程：隊友出手提早 ' + pull + ' 分鐘', [], 'buff');
            } else {
              st.protocolBlocked = true;
              say(t, u, '沒有醫師監督，預立特定醫療流程無法啟動', [], 'warn');
            }
          } else {
            say(t, u, '床邊評估', [hit(u, front(), d.power)]);
          }
          break;
        }
        case 'vasopressor': {
          if (st.vasoAt === null) st.vasoAt = t;
          const hits = [];
          const hy = firstOf('hypotension');
          if (hy) hits.push(hit(u, hy, d.power));
          else hits.push(hit(u, firstOf('mods'), Math.round(d.power / 2)));
          if (lactate && targetable(lactate)) hits.push(hit(u, lactate, 5));
          say(t, u, 'Titrate NE（MAP ≥ 65）', hits);
          break;
        }
        case 'supervise': {
          if (st.vasoAt === null) st.vasoAt = t;
          const target = firstOf('hypotension') || firstOf('mods') || front();
          say(t, u, '開立升壓劑並監督', [hit(u, target, d.power)]);
          break;
        }
        case 'sourceControl': {
          if (st.sourceAt === null) st.sourceAt = t;
          const m = firstOf('mods');
          if (m) say(t, u, '感染源控制', [hit(u, m, d.power)]);
          else say(t, u, '感染源控制', enemies.filter((e) => e.kind === 'pathogen' && targetable(e)).map((e) => hit(u, e, 15)));
          break;
        }
        default:
          throw new Error('Unknown skill: ' + d.skill);
      }
    }

    let endTime = C.end;
    for (let t = C.step; t <= C.end; t += C.step) {
      if (lactate && alive(lactate) && !st.resus && hour1 < 2 && t % 10 === 0) {
        lactate.hp += lactate.growth;
        lactate.maxHp = Math.max(lactate.maxHp, lactate.hp);
      }
      for (const u of units) {
        if (u.next <= t) {
          act(u, t);
          u.acted += 1;
          u.next = t + Math.max(10, u.def.interval - haste);
        }
      }
      if (t % C.pressureEvery === 0) {
        const p = enemies.reduce((s, e) => s + enemyPressure(e), 0);
        if (p > 0) {
          pressure += p;
          events.push({ t, kind: 'pressure', action: '病理過程持續：病人安全 −' + p, hits: [] });
        }
      }
      frames.push({ t, hp: enemies.map((e) => e.hp), max: enemies.map((e) => e.maxHp), lactateSeen: st.lactateAt !== null });
      if (enemies.every((e) => !alive(e))) { endTime = t; break; }
    }

    const win = enemies.every((e) => !alive(e));
    const remaining = enemies.filter(alive).map((e) => ({ name: e.name, kind: e.kind, hp: e.hp, threat: enemyThreat(e) }));
    const remainingThreat = remaining.reduce((s, e) => s + e.threat, 0);
    const penalties = [];
    if (wave.shock && (st.abxAt === null || st.abxAt > C.abxWindow)) {
      penalties.push({ id: 'abxLate', amount: C.abxLatePenalty, text: '抗生素延誤（> ' + C.abxWindow + ' 分鐘或未給）' });
    }
    const damage = pressure + remainingThreat + penalties.reduce((s, p) => s + p.amount, 0);

    const executed = {
      lactate: st.lactateAt,
      blood_culture: st.cultureAt,
      antimicrobials: st.abxAt,
      crystalloid: st.fluidAt,
      vasopressor: st.vasoAt,
    };

    return {
      win, damage, pressure, remainingThreat, remaining, penalties, endTime,
      events, frames,
      enemies: enemies.map((e) => ({ key: e.key, kind: e.kind, name: e.name, startHp: e.kind === 'lactate' ? wave.lactateHp : e.maxHp })),
      traits,
      metrics: {
        bundleOnBoard: traits.bundle.count,
        bundlePresent: traits.bundle.present,
        executed,
        executedCount: Object.values(executed).filter((v) => v !== null).length,
        cultureBeforeAbx: st.cultureBonus,
        abxAt: st.abxAt,
        abxOnTime: st.abxAt !== null && st.abxAt <= C.abxWindow,
        lactateMeasured: st.lactateAt !== null,
        sourceControlAt: st.sourceAt,
        protocolAt: st.protocolAt,
        protocolBlocked: st.protocolBlocked,
      },
    };
  }

  // ── 交班 debrief：ISBAR + 指引對照
  function buildDebrief(wave, assessment, combat, data) {
    const N = data.NOTES;
    const notes = [];
    const m = combat.metrics;
    const hasKind = (k) => combat.enemies.some((e) => e.kind === k);
    const warn = (n) => notes.push({ kind: 'warn', text: n.text, source: n.source });
    const good = (text, source) => notes.push({ kind: 'good', text, source });

    if (assessment && assessment.tool === 'qsofa') warn(N.qsofaOnly);
    if (hasKind('lactate') && !m.lactateMeasured) warn(N.lactateMissing);
    if (hasKind('pathogen') || hasKind('mods')) {
      if (m.executed.blood_culture === null) warn(N.cultureMissing);
      else if (!m.cultureBeforeAbx) warn(N.cultureAfterAbx);
      else if (!wave.shock || m.abxOnTime) good('抗生素前已完成血液培養。', N.cultureAfterAbx.source);
    }
    if (wave.shock) {
      if (!m.abxOnTime) warn(m.cultureBeforeAbx ? N.cultureDelayedAbx : N.abxLate);
      else good('第一劑抗生素在第 ' + m.abxAt + ' 分鐘給，有在 60 分鐘內。', N.abxLate.source);
      if (m.executed.crystalloid === null) warn(N.fluidMissing);
      if (m.executed.vasopressor === null) warn(N.vasoMissing);
    }
    if (hasKind('mods')) {
      if (m.sourceControlAt === null) warn(N.sourceControl);
      else good('第 ' + m.sourceControlAt + ' 分鐘完成感染源控制。', N.sourceControl.source);
    }
    if (m.protocolBlocked) warn(N.npNoSupervision);
    if (combat.traits.bundle.tier >= 2) good(N.hour1Complete.text, N.hour1Complete.source);
    if (wave.note) notes.push({ kind: 'info', text: wave.note, source: data.SRC.ssc2021 });

    const fmt = (v) => (v === null ? '—' : v + ' 分');
    const names = {};
    data.BUNDLE.forEach((b) => { names[b.id] = b.short; });
    const execText = data.BUNDLE.map((b) => names[b.id] + ' ' + fmt(m.executed[b.id])).join('、');
    const firstWarn = notes.find((n) => n.kind === 'warn');
    const toolName = assessment ? data.TOOLS[assessment.tool].name : '—';

    const isbar = {
      I: '68 歲男性・社區型肺炎・第 ' + wave.round + ' 回合：' + wave.title,
      S: combat.win
        ? '第 ' + combat.endTime + ' 分鐘控制住所有病理過程；病人安全指數 −' + combat.damage + '。'
        : '還沒控制住：' + combat.remaining.map((e) => e.name).join('、') + '；病人安全指數 −' + combat.damage + '。',
      B: assessment
        ? '評估工具 ' + toolName + '；異常值判讀 ' + assessment.correct.length + '/' + assessment.abnormalTotal +
          (assessment.falseFlags.length ? '，誤判 ' + assessment.falseFlags.length + ' 項' : '') + '。'
        : '—',
      A: 'Hour-1 bundle 上場 ' + m.bundleOnBoard + '/5；執行時間：' + execText + '。',
      R: firstWarn ? firstWarn.text : '維持目前策略，持續追蹤 lactate 和 MAP。',
    };

    return { isbar, notes, simplifications: data.SIMPLIFICATIONS };
  }

  // ── 經濟與商店
  function income(gold, streakLen, data) {
    const E = data.ECONOMY;
    const interest = Math.min(E.interestMax, Math.floor(gold / E.interestPer));
    const streak = streakLen >= 4 ? 2 : streakLen >= 2 ? 1 : 0;
    return { base: E.baseIncome, interest, streak, total: E.baseIncome + interest + streak };
  }

  // ensure：玩家還缺的 bundle 元素。商店至少放一張能補上缺項的卡（本回合買得到的費用），
  // 讓學習重點放在「選誰、排哪裡」，不是運氣。
  function rollShop(rng, round, data, ensure) {
    const odds = data.SHOP_ODDS[round] || data.SHOP_ODDS[5];
    const out = [];
    for (let i = 0; i < data.ECONOMY.shopSize; i++) {
      const r = rng.next();
      let acc = 0;
      let cost = 1;
      for (const c of [1, 2, 3, 4]) {
        acc += odds[c];
        if (r < acc) { cost = c; break; }
        cost = c;
      }
      const pool = data.UNITS.filter((u) => u.cost === cost);
      out.push(pool[rng.int(pool.length)].id);
    }
    const need = (ensure || []).filter(Boolean);
    if (need.length) {
      const provides = (u) => u.bundle.some((b) => need.includes(b));
      if (!out.some((id) => provides(unitById(data, id)))) {
        const cands = data.UNITS.filter((u) => odds[u.cost] > 0 && provides(u));
        if (cands.length) out[rng.int(out.length)] = cands[rng.int(cands.length)].id;
      }
    }
    return out;
  }

  function pickAugments(rng, data, taken) {
    const pool = data.AUGMENTS.filter((a) => !(taken || []).includes(a.id)).map((a) => a.id);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = rng.int(i + 1);
      const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    return pool.slice(0, 3);
  }

  function teamCap(wave, augments) {
    return Math.max(1, wave.cap - ((augments || []).includes('shortage') ? 1 : 0));
  }

  function slotTime(slot, data) {
    return data.COMBAT.slotSpacing * (slot + 1);
  }

  return {
    createRng, unitById, computeTraits, expandEnemies, evaluateAssessment,
    simulateCombat, buildDebrief, income, rollShop, pickAugments, teamCap, slotTime,
  };
});
