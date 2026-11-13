/*
 * 每回合的建議陣容（順序＝站位＝出手順序）。測試會確認每一組都能控制住該回合。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Presets = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return {
    1: ['ipc_culture', 'resident', 'rn_lactate'],
    2: ['rn_lactate', 'ipc_culture', 'resident', 'rn_fluid'],
    3: ['rn_lactate', 'ipc_culture', 'resident', 'rn_fluid', 'senior_rn'],
    4: ['np', 'rn_lactate', 'ipc_culture', 'resident', 'rn_fluid', 'senior_rn'],
    5: ['np', 'rn_lactate', 'ipc_culture', 'resident', 'rn_fluid', 'senior_rn', 'surgeon'],
  };
});
