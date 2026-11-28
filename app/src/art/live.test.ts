// 會動的畫面的插圖：病室要哪幾張、清單上的每一張檔案都在、圖不齊就不用
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import MANIFEST from './live-manifest.js';
import { hasLive, liveFor } from './live.js';
import { placeOf, wardLiveIds } from './ward.js';

test('病室要的圖：房間、病人三張、孟拓三張、馬凱三張、劫影，有主角再加兩張', () => {
  const ids = wardLiveIds({ patient: 'lin', scene: 'ward', shadow: 'moth', hero: 'cheng' });
  assert.equal(ids.length, 13);
  assert.equal(ids[0], 'room-ward');
  assert.ok(ids.includes('patient-lin-c') && ids.includes('shadow-moth') && ids.includes('hero-cheng-b'));
  assert.equal(wardLiveIds({ patient: 'lin', scene: 'ward' }).length, 11);
  // 外島的診間借大島那一間；雨天是同一間
  assert.deepEqual(placeOf('wind-rain'), { place: 'market', rain: true });
  assert.equal(wardLiveIds({ patient: 'c07a', scene: 'boar' })[0], 'room-yard');
  assert.equal(wardLiveIds({ patient: 'nobody' })[1], 'patient-lin-a');
  // 長老、常駐的人：只要房間和那一張
  assert.deepEqual(wardLiveIds({ patient: 'e-lu', scene: 'market', stand: 'elder-lu' }), ['room-market', 'elder-lu']);
  // 只有一張的病人（值班夜）：b、c 沒有就不要求
  const night = wardLiveIds({ patient: 'n1' });
  if ((MANIFEST.sprites as Record<string, unknown>)['patient-n1-a']) assert.deepEqual(night.filter((id) => id.startsWith('patient-')), ['patient-n1-a']);
});

test('圖不齊就不用：照舊程式畫', () => {
  assert.equal(hasLive([]), false);
  assert.equal(hasLive(['room-nowhere']), false);
  assert.equal(liveFor(['room-nowhere']), null);
});

test('清單上的每一張圖都有檔案，大小有寫', () => {
  for (const [id, m] of Object.entries(MANIFEST.sprites as Record<string, { src: string; width?: number; height?: number }>)) {
    assert.ok(existsSync(fileURLToPath(new URL('../../public/' + m.src, import.meta.url))), id + ' 少了檔案');
    if (!id.startsWith('room-') && id !== 'hall' && id !== 'title') assert.ok(m.width || m.height, id + ' 沒有寫大小');
  }
});
