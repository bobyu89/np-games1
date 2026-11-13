/*
 * 《黃金一小時》灰盒原型：遊戲資料
 * 這是拋棄式原型（見 docs/GDD-v0.md §8），不 import 進正式程式。
 * 所有臨床內容都是教學用簡化，需經臨床專家審閱；每條臨床規則都有 source。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GameData = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SRC = {
    ssc2021: 'Evans et al. (2021) Surviving Sepsis Campaign 2021',
    levy2018: 'Levy, Evans, & Rhodes (2018) SSC Hour-1 bundle',
    muller2018: 'Müller et al. (2018) SBAR systematic review',
    taiwanNP: '專科護理師於醫師監督下執行醫療業務辦法（內容凍結前需對照現行條文）',
  };

  // Hour-1 bundle 五要素（Levy et al., 2018）
  const BUNDLE = [
    { id: 'lactate', name: 'Lactate 量測', short: '乳酸' },
    { id: 'blood_culture', name: '抗生素前採血液培養', short: '培養' },
    { id: 'antimicrobials', name: '廣效抗生素', short: '抗生素' },
    { id: 'crystalloid', name: 'Crystalloid 30 mL/kg', short: '輸液' },
    { id: 'vasopressor', name: 'Vasopressor（MAP ≥ 65）', short: '升壓' },
  ];

  // 職能羈絆：計算場上「不重複」角色數
  const ROLES = {
    assessor: {
      name: '評估型',
      tiers: [
        { n: 2, crit: 0.2, text: '全隊爆擊率 20%（×1.5）' },
        { n: 3, crit: 0.35, text: '全隊爆擊率 35%（×1.5）' },
      ],
    },
    interventionist: {
      name: '處置型',
      tiers: [
        { n: 2, power: 0.2, text: '處置型成員處置力 +20%' },
        { n: 4, power: 0.45, text: '處置型成員處置力 +45%' },
      ],
    },
    coordinator: {
      name: '協調型',
      tiers: [
        { n: 2, haste: 5, text: '全隊出手間隔 −5 分鐘' },
        { n: 3, haste: 10, text: '全隊出手間隔 −10 分鐘' },
      ],
    },
  };

  const HOUR1_TIERS = [
    { n: 3, text: '全隊處置力 +15%' },
    { n: 5, text: '黃金一小時：對低血壓、MODS 傷害 +40%，乳酸停止上升' },
  ];

  // v0 角色名單（GDD §4.1）。角色都是職類原型，不對應真實人物。
  // interval：出手間隔（分鐘）；power：基礎處置力
  const UNITS = [
    {
      id: 'rn_lactate', name: 'ICU 護理師・抽血', short: '抽血 RN', cost: 1,
      roles: ['assessor'], bundle: ['lactate'], interval: 30, power: 8, skill: 'measureLactate',
      desc: '量測乳酸：讓「乳酸堆積」現形、可以被處置，之後每次追蹤造成 8 點。',
      source: SRC.levy2018,
    },
    {
      id: 'rn_fluid', name: 'ICU 護理師・輸液', short: '輸液 RN', cost: 1,
      roles: ['interventionist'], bundle: ['crystalloid'], interval: 20, power: 12, skill: 'fluid',
      desc: '快速輸液：對「低血壓」12 點。開始輸液後乳酸停止上升；已量測的乳酸 −6。',
      source: SRC.ssc2021,
    },
    {
      id: 'ipc_culture', name: '感控護理師', short: '感控 RN', cost: 2,
      roles: ['assessor'], bundle: ['blood_culture'], interval: 30, power: 4, skill: 'culture',
      desc: '血液培養：第一次出手完成採檢。在第一劑抗生素「之前」完成，抗生素傷害 ×1.5。之後對菌群 4 點。',
      source: SRC.levy2018,
    },
    {
      id: 'pharmacist', name: '臨床藥師', short: '藥師', cost: 2,
      roles: ['coordinator'], bundle: [], interval: 40, power: 0, skill: 'optimize',
      desc: '劑量優化：第一次出手後，抗生素傷害 +25%。',
    },
    {
      id: 'resident', name: '住院醫師', short: '住院醫師', cost: 2,
      roles: ['interventionist'], bundle: ['antimicrobials'], interval: 20, power: 12, skill: 'antibiotic',
      physician: true,
      desc: '廣效抗生素：對所有菌群 12 點、對 MODS 4 點。',
      source: SRC.ssc2021,
    },
    {
      id: 'rt', name: '呼吸治療師', short: 'RT', cost: 2,
      roles: ['interventionist'], bundle: [], interval: 20, power: 8, skill: 'support',
      desc: '氧療支援：對最前方的敵人 8 點。不屬於 sepsis bundle（留給 ARDS 章）。',
    },
    {
      id: 'np', name: 'NP 學長姐', short: 'NP', cost: 3,
      roles: ['assessor', 'coordinator'], bundle: [], interval: 40, power: 6, skill: 'protocol',
      desc: '預立特定醫療流程：場上有醫師角色（代表醫師監督）時，第一次出手讓所有隊友的下一次出手提早 15 分鐘（主治在場時 20 分鐘）。之後對最前方敵人 6 點。同時算評估型＋協調型。',
      source: SRC.taiwanNP,
    },
    {
      id: 'senior_rn', name: '資深重症護理師', short: '資深 RN', cost: 3,
      roles: ['interventionist'], bundle: ['vasopressor'], interval: 20, power: 16, skill: 'vasopressor',
      desc: 'Titrate NE：對「低血壓」16 點（沒有低血壓時對 MODS 8 點）；已量測的乳酸 −5。',
      source: SRC.ssc2021,
    },
    {
      id: 'attending', name: '主治醫師', short: '主治', cost: 4,
      roles: ['coordinator'], bundle: ['vasopressor'], interval: 30, power: 14, skill: 'supervise',
      physician: true,
      desc: '監督：讓 NP 技能可以發動並加強效果。開立升壓劑：對「低血壓」或 MODS 14 點。',
      source: SRC.ssc2021,
    },
    {
      id: 'surgeon', name: '外科醫師', short: '外科', cost: 4,
      roles: ['interventionist'], bundle: [], extra: ['source_control'], interval: 40, power: 60, skill: 'sourceControl',
      physician: true,
      desc: '感染源控制：對 MODS 60 點；沒有 MODS 時對所有菌群 15 點。',
      source: SRC.ssc2021,
    },
  ];

  // 敵人是病理過程，不是病人（GDD §4.4）
  const ENEMIES = {
    pathogen: { kind: 'pathogen', name: '菌群', hp: 30, threat: 5, desc: '被抗生素克制' },
    hypotension: { kind: 'hypotension', name: '低血壓', hp: 90, threat: 12, desc: '要靠輸液加升壓' },
    hypotension_plus: { kind: 'hypotension', name: '低血壓（NE 需求上升）', hp: 120, threat: 14, desc: '要靠輸液加升壓' },
    lactate: { kind: 'lactate', name: '乳酸堆積', hp: 15, growth: 3, desc: '沒量測前無法處置；開始輸液前每 10 分鐘 +3' },
    mods: { kind: 'mods', name: '器官衰竭 MODS', hp: 300, threat: 30, desc: 'Boss：要完整 bundle 加感染源控制' },
  };

  // 評估工具。quality：good / partial / poor（決定揭露多少敵情）
  // 第 1–4 回合用 qSOFA / SIRS / NEWS2；第 5 回合改為 qSOFA / SIRS / SOFA
  const TOOLS = {
    qsofa: { name: 'qSOFA' },
    sirs: { name: 'SIRS' },
    news2: { name: 'NEWS2' },
    sofa: { name: 'SOFA' },
  };

  // 第一章：一位 septic shock 病人的黃金一小時（虛構教學案例，數值需臨床專家審閱）
  const WAVES = [
    {
      round: 1, title: '轉入 ICU：疑似感染', shock: false, cap: 3, lactateHp: null,
      summary: '68 歲男性，社區型肺炎，今晨從急診轉入 ICU。',
      params: [
        { id: 'temp', label: '體溫', value: '38.9 °C', abnormal: true, why: '> 38 °C' },
        { id: 'hr', label: '心跳', value: '112 /min', abnormal: true, why: '> 90 /min' },
        { id: 'rr', label: '呼吸', value: '24 /min', abnormal: true, why: '> 20 /min' },
        { id: 'bp', label: '血壓', value: '128/76 mmHg', abnormal: false, why: 'SBP > 100、MAP ≈ 93' },
        { id: 'spo2', label: 'SpO₂', value: '97%（room air）', abnormal: false, why: '≥ 96%' },
        { id: 'loc', label: '意識', value: '清醒（Alert）', abnormal: false, why: 'Alert' },
        { id: 'wbc', label: 'WBC', value: '14,800 /µL', abnormal: true, why: '> 12,000 /µL' },
      ],
      tools: {
        qsofa: { quality: 'poor', result: 'qSOFA 1 分（只有 RR ≥ 22）：未達 ≥ 2，可能漏判。' },
        sirs: { quality: 'good', result: 'SIRS 4/4（體溫、心跳、呼吸、WBC）：符合，應評估是否為 sepsis。' },
        news2: { quality: 'good', result: 'NEWS2 5 分（中度風險）：需要緊急臨床評估。' },
      },
      enemies: [['pathogen', 3]],
    },
    {
      round: 2, title: 'ICU 第 3 小時：病況惡化', shock: false, cap: 4, lactateHp: 15,
      summary: '發燒持續，呼吸變喘，抽血結果剛出來。',
      params: [
        { id: 'temp', label: '體溫', value: '39.2 °C', abnormal: true, why: '> 38 °C' },
        { id: 'hr', label: '心跳', value: '118 /min', abnormal: true, why: '> 90 /min' },
        { id: 'rr', label: '呼吸', value: '26 /min', abnormal: true, why: '> 20 /min' },
        { id: 'bp', label: '血壓', value: '104/62 mmHg', abnormal: false, why: 'SBP > 100、MAP ≈ 76（仍 ≥ 65）' },
        { id: 'spo2', label: 'SpO₂', value: '93%（room air）', abnormal: true, why: '≤ 95%（NEWS2 計分）' },
        { id: 'loc', label: '意識', value: '清醒（Alert）', abnormal: false, why: 'Alert' },
        { id: 'lac', label: 'Lactate', value: '2.6 mmol/L', abnormal: true, why: '> 2 mmol/L' },
        { id: 'wbc', label: 'WBC', value: '16,200 /µL', abnormal: true, why: '> 12,000 /µL' },
      ],
      tools: {
        qsofa: { quality: 'poor', result: 'qSOFA 1 分（只有 RR ≥ 22）：又一次未達 ≥ 2。' },
        sirs: { quality: 'good', result: 'SIRS 4/4：符合，加上 lactate 2.6，高度懷疑 sepsis。' },
        news2: { quality: 'good', result: 'NEWS2 10 分（高風險）：需要緊急處置。' },
      },
      enemies: [['pathogen', 4], ['lactate', 1]],
    },
    {
      round: 3, title: '疑似 septic shock', shock: true, cap: 5, lactateHp: 25,
      summary: '血壓掉下來，意識變差。現在開始計算黃金一小時。',
      params: [
        { id: 'temp', label: '體溫', value: '38.6 °C', abnormal: true, why: '> 38 °C' },
        { id: 'hr', label: '心跳', value: '128 /min', abnormal: true, why: '> 90 /min' },
        { id: 'rr', label: '呼吸', value: '28 /min', abnormal: true, why: '> 20 /min' },
        { id: 'bp', label: '血壓', value: '82/46 mmHg', abnormal: true, why: 'MAP ≈ 58（< 65）' },
        { id: 'spo2', label: 'SpO₂', value: '92%（NC 2 L/min）', abnormal: true, why: '≤ 95% 且需給氧' },
        { id: 'loc', label: '意識', value: '嗜睡（叫得醒）', abnormal: true, why: '非 Alert' },
        { id: 'lac', label: 'Lactate', value: '4.2 mmol/L', abnormal: true, why: '≥ 4 mmol/L' },
        { id: 'glu', label: '血糖', value: '142 mg/dL', abnormal: false, why: '< 180 mg/dL（SSC 2021：≥ 180 才開始 insulin）' },
      ],
      tools: {
        qsofa: { quality: 'partial', result: 'qSOFA 3 分：陽性有預後意義，但 SSC 2021 不建議單獨用 qSOFA 篩檢。' },
        sirs: { quality: 'good', result: 'SIRS 4/4，加上 MAP < 65、lactate 4.2：疑似 septic shock。' },
        news2: { quality: 'good', result: 'NEWS2 16 分（高風險）：立即處置。' },
      },
      enemies: [['hypotension', 2], ['pathogen', 2], ['lactate', 1]],
    },
    {
      round: 4, title: 'NE 需求上升', shock: true, cap: 6, lactateHp: 25,
      summary: '已經上 NE，劑量卻一直往上調。',
      params: [
        { id: 'bp', label: '血壓', value: '88/52 mmHg（NE 0.28 µg/kg/min）', abnormal: true, why: 'MAP ≈ 64（< 65）' },
        { id: 'hr', label: '心跳', value: '122 /min', abnormal: true, why: '> 90 /min' },
        { id: 'rr', label: '呼吸', value: '24 /min', abnormal: true, why: '> 20 /min' },
        { id: 'temp', label: '體溫', value: '38.2 °C', abnormal: true, why: '> 38 °C' },
        { id: 'spo2', label: 'SpO₂', value: '95%（NC 3 L/min）', abnormal: true, why: '≤ 95% 且需給氧' },
        { id: 'loc', label: '意識', value: '嗜睡（叫得醒）', abnormal: true, why: '非 Alert' },
        { id: 'lac', label: 'Lactate', value: '3.4 mmol/L', abnormal: true, why: '> 2 mmol/L' },
        { id: 'k', label: '血鉀', value: '4.1 mmol/L', abnormal: false, why: '正常範圍' },
      ],
      tools: {
        qsofa: { quality: 'partial', result: 'qSOFA 3 分：陽性，但看不出升壓需求和組織灌流的變化。' },
        sirs: { quality: 'good', result: 'SIRS 符合，MAP 仍 < 65、lactate 3.4：休克尚未控制。' },
        news2: { quality: 'good', result: 'NEWS2 14 分（高風險）：休克持續。' },
      },
      enemies: [['hypotension_plus', 2], ['pathogen', 2], ['lactate', 1]],
      note: 'NE 不夠時，SSC 2021 建議加 vasopressin，而不是一直拉高 NE 劑量（弱建議）。裝備系統會在下一版加入。',
    },
    {
      round: 5, title: '多重器官衰竭（MODS）', shock: true, cap: 7, lactateHp: 30,
      summary: '多個器官開始出問題，感染源還沒有控制。',
      params: [
        { id: 'bp', label: '血壓', value: '92/54 mmHg（NE 0.12 µg/kg/min）', abnormal: true, why: '要靠升壓劑維持（SOFA 心血管 4 分）' },
        { id: 'pf', label: 'PaO₂/FiO₂', value: '220', abnormal: true, why: '< 300（SOFA 呼吸 2 分）' },
        { id: 'plt', label: 'Platelet', value: '86,000 /µL', abnormal: true, why: '< 100,000（SOFA 凝血 2 分）' },
        { id: 'bil', label: 'Bilirubin', value: '2.3 mg/dL', abnormal: true, why: '2.0–5.9（SOFA 肝 2 分）' },
        { id: 'gcs', label: 'GCS', value: '13', abnormal: true, why: '13–14（SOFA 神經 1 分）' },
        { id: 'cr', label: 'Creatinine', value: '2.4 mg/dL', abnormal: true, why: '2.0–3.4（SOFA 腎 2 分）' },
        { id: 'temp', label: '體溫', value: '37.6 °C', abnormal: false, why: '36–38 °C' },
        { id: 'glu', label: '血糖', value: '156 mg/dL', abnormal: false, why: '< 180 mg/dL' },
      ],
      tools: {
        qsofa: { quality: 'poor', result: 'qSOFA 是床邊篩檢，看不出哪些器官受損、受損多嚴重。' },
        sirs: { quality: 'partial', result: 'SIRS 反映發炎反應，不能用來評估器官功能。' },
        sofa: { quality: 'good', result: 'SOFA 13 分（呼吸 2・凝血 2・肝 2・心血管 4・神經 1・腎 2）：多重器官功能障礙。' },
      },
      enemies: [['mods', 1], ['pathogen', 2], ['lactate', 1]],
    },
  ];

  // 院務事件（GDD §4.7），第 2、4 回合開始時三選一
  const AUGMENTS = [
    { id: 'alert', name: 'Sepsis 電子警示上線', desc: '之後每回合評估多揭露 1 項敵情。', source: SRC.ssc2021 + '：醫院應建立 sepsis 改善計畫，包括篩檢' },
    { id: 'asp', name: '抗生素管理計畫 ASP', desc: '抗生素傷害 +20%。' },
    { id: 'rrt', name: '快速反應小組上線', desc: '評估型羈絆門檻 −1。' },
    { id: 'shortage', name: '夜班人力短缺', desc: '之後上場人數 −1，立即獲得 4 點資源。' },
  ];

  // 交班 debrief 用的指引對照（每條都附出處）
  const NOTES = {
    qsofaOnly: { text: '不建議單獨用 qSOFA 篩檢 sepsis；SIRS、NEWS、MEWS 比較適合（強建議）。', source: SRC.ssc2021 },
    lactateMissing: { text: 'Hour-1 bundle 第一項就是量測 lactate，> 2 mmol/L 要追蹤；lactate 偏高時，建議以 lactate 下降來引導復甦（弱建議）。', source: SRC.levy2018 + '；' + SRC.ssc2021 },
    cultureAfterAbx: { text: '應在給抗生素「之前」採血液培養，但不能因此延誤抗生素。', source: SRC.levy2018 },
    cultureMissing: { text: '這回合沒有採血液培養。Hour-1 bundle 要求抗生素前先採培養。', source: SRC.levy2018 },
    abxLate: { text: '疑似 septic shock 時，應立即給抗生素，最好在辨識後 1 小時內（強建議）。', source: SRC.ssc2021 },
    cultureDelayedAbx: { text: '先培養是對的，但抗生素超過 60 分鐘才給。採檢不能拖慢第一劑抗生素。', source: SRC.levy2018 + '；' + SRC.ssc2021 },
    fluidMissing: { text: 'sepsis 造成灌流不足或休克時，建議前 3 小時給至少 30 mL/kg crystalloid（弱建議）。', source: SRC.ssc2021 },
    vasoMissing: { text: 'NE 是 first-line 升壓劑（強建議），初始 MAP 目標 65 mmHg（強建議）；可以先從周邊給，不必等 CVC（弱建議）。', source: SRC.ssc2021 },
    sourceControl: { text: '應盡快確認或排除需要緊急感染源控制的部位，並盡早處置（best practice statement）。', source: SRC.ssc2021 },
    npNoSupervision: { text: 'NP 的預立特定醫療流程要在醫師監督下執行；這回合場上沒有醫師角色，技能沒有發動。', source: SRC.taiwanNP },
    hour1Complete: { text: 'Hour-1 bundle 五項全部做到。研究顯示 bundle 執行越完整，病人結果越好。', source: SRC.levy2018 },
  };

  // 遊戲簡化說明：debrief 時明講（GDD §6.3）
  const SIMPLIFICATIONS = [
    '時間軸以分鐘計：真實的時效是從「辨識 sepsis」開始算。',
    '血液培養的價值在於之後依結果調整抗生素（de-escalation），不是讓第一劑更有效；遊戲用傷害加成來表示「做對順序」。',
    '遊戲裡輸液是一次性效果；實際上 SSC 2021 建議用動態指標評估 fluid responsiveness，不要只靠身體檢查或靜態參數（弱建議）。',
    '角色是職類原型。真實的分工、醫囑權限和 NP 執業範疇，以現行法規和院內規範為準。',
  ];

  // 商店各費用出現機率（依回合）
  const SHOP_ODDS = {
    1: { 1: 0.6, 2: 0.4, 3: 0, 4: 0 },
    2: { 1: 0.45, 2: 0.4, 3: 0.15, 4: 0 },
    3: { 1: 0.3, 2: 0.35, 3: 0.3, 4: 0.05 },
    4: { 1: 0.25, 2: 0.35, 3: 0.3, 4: 0.1 },
    5: { 1: 0.2, 2: 0.3, 3: 0.3, 4: 0.2 },
  };

  const ECONOMY = {
    startGold: 6,
    baseIncome: 5,
    interestPer: 10,
    interestMax: 5,
    rerollCost: 1,
    benchSize: 6,
    shopSize: 5,
    startSafety: 100,
  };

  const COMBAT = {
    end: 150,         // 處置時間軸長度（分鐘）
    step: 5,          // 模擬步長（分鐘）
    slotSpacing: 15,  // 第 n 位第一次出手 = 15 × n 分鐘
    abxWindow: 60,    // 疑似 septic shock：抗生素時間窗（分鐘）
    abxLatePenalty: 8,
    pressureEvery: 60, // 每 60 分鐘，未處理的病理過程持續傷害病人
    slots: 8,         // 2 排 × 4 格
  };

  return {
    VERSION: '0.1.0',
    SRC, BUNDLE, ROLES, HOUR1_TIERS, UNITS, ENEMIES, TOOLS, WAVES, AUGMENTS,
    NOTES, SIMPLIFICATIONS, SHOP_ODDS, ECONOMY, COMBAT,
  };
});
