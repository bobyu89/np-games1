// 航海日誌：照你每天做了什麼，自動寫成一天一頁；底下可以自己補一句。
// 全部從存檔算出來（打卡的日子、最近幾場的紀錄、自己寫的話），沒有另外記。
import { CASES } from '../data/index.ts';
import { PERILS } from '../data/odyssey.ts';
import { TRIAL_PASS } from './progress.ts';
import { dayKey } from './streak.ts';
import type { PlayRecord, Save } from './store.ts';

export interface DiaryDay {
  day: string;
  /** 「11 月 23 日（一）」 */
  title: string;
  /** 這一天的每一場，早的在前面 */
  plays: PlayRecord[];
  /** 自動寫好的幾句話 */
  lines: string[];
  /** 自己寫的那一句（沒寫是空字串） */
  note: string;
}

const WEEK = '日一二三四五六';
export function dayTitle(day: string): string {
  const [, m, d] = day.split('-').map(Number), w = new Date(day + 'T00:00:00Z').getUTCDay();
  return m + ' 月 ' + d + ' 日（' + WEEK[w] + '）';
}

/** 「柯蒲（喘）82 分」 */
function who(p: PlayRecord): string {
  const c = CASES.find((k) => k.id === p.caseId);
  return c ? c.patient.name + '（' + c.complaintName + '）' : '一位病人';
}

/** 這一天的幾句話 */
export function linesOf(plays: PlayRecord[], checkedIn: boolean): string[] {
  const out: string[] = [];
  const quests = plays.filter((p) => !p.trial), trials = plays.filter((p) => p.trial);
  if (quests.length) out.push('結案了 ' + quests.length + ' 張委託：' + quests.map((p) => who(p) + p.score + ' 分' + (p.found ? '' : '，診斷還沒對')).join('；') + '。');
  if (trials.length) out.push('考了 ' + trials.length + ' 次試弓：' + trials.map((p) => who(p) + p.score + ' 分' + (p.score >= TRIAL_PASS ? '，及格' : '，還沒到及格線')).join('；') + '。');
  const perilOf = (p: PlayRecord) => { const c = CASES.find((k) => k.id === p.caseId); return c ? PERILS[c.complaint] : undefined; };
  const caught = [...new Set(plays.filter((p) => p.trapped === true).map(perilOf).filter((x) => !!x))];
  const passed = [...new Set(plays.filter((p) => p.trapped === false).map(perilOf).filter((x) => !!x && !caught.includes(x)))];
  if (caught.length) out.push('被困住的：' + caught.map((x) => x!.name + '（' + x!.bias.name + '）').join('、') + '。');
  if (passed.length) out.push('過了：' + passed.map((x) => x!.name).join('、') + '。');
  const said = [...new Set(plays.map((p) => p.takeaway).filter((t): t is string => !!t))];
  if (said.length) out.push('帶回公會的話：' + said.map((t) => '「' + t + '」').join('、') + '。');
  if (!plays.length) out.push(checkedIn ? '這一天有打卡。那時候的細節沒有留下來（紀錄只留最近 300 場）。' : '這一天還沒有結案任何委託。');
  return out;
}

/** 有紀錄的每一天，新的在前面。今天一定有一頁（可以先寫一句） */
export function diaryOf(save: Save, now = Date.now()): DiaryDay[] {
  const today = dayKey(now), byDay = new Map<string, PlayRecord[]>();
  for (const p of save.plays ?? []) { const d = dayKey(p.at); byDay.set(d, [...(byDay.get(d) ?? []), p]); }
  const days = new Set([today, ...(save.days ?? []), ...byDay.keys(), ...Object.entries(save.notes ?? {}).filter(([, n]) => n.text).map(([d]) => d)]);
  return [...days].sort().reverse().map((day) => {
    const plays = (byDay.get(day) ?? []).sort((a, b) => a.at - b.at);
    return { day, title: dayTitle(day), plays, lines: linesOf(plays, (save.days ?? []).includes(day)), note: save.notes?.[day]?.text ?? '' };
  });
}

/** 自己寫的一句：去掉頭尾空白、最多 500 字。寫空的就是刪掉（還是留一筆，同步的時候另一台才知道刪了） */
export const NOTE_MAX = 500;
export function withNote(save: Save, day: string, text: string, at = Date.now()): Save {
  return { ...save, notes: { ...(save.notes ?? {}), [day]: { text: text.trim().slice(0, NOTE_MAX), at } } };
}
