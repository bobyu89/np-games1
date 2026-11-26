// 公會大廳：故事的段落、委託板、圖鑑（劫影、人物、場景）、選主角。
import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CaseDef } from '../core/types.ts';
import { SAFETY_LABEL } from '../core/scoring.ts';
import { COMPLAINTS, FINALE_ID, caseById } from '../data/index.ts';
import { placeOf, whereOf } from '../data/places.ts';
import { ISLANDS, type IslandId } from '../data/islands.ts';
import { SeaChart, type ChartIsle } from './SeaChart.tsx';
import { TIDES, TIDE_DONE } from '../data/tides.ts';
import { Stage, type StageHandle } from './Stage.tsx';
import { Talk, type TalkHandle, type Who } from './Talk.tsx';
import { Sheet } from './Sheets.tsx';
import { sfx, sound } from './sound.ts';
import type { Run, Save } from './store.ts';
import { Settings, StatsFacts } from './Settings.tsx';
import { setConsent, statsBuilt, statsConsent, statsSubscribe } from './stats.ts';
import { applyUpdate, pwaState, pwaSubscribe } from './pwa.ts';
import { AXE, axesLit, cantoOpen, islandOf, questsOn, nextStep, sideStep, type NextAction, perilsPassed, PASSED, chapterDone, chapterOpen, homeOf, ARCHIVE, BEATS, HEROES, QUESTS, TRIAL_PASS, finaleDone, finaleOpen, nightDone, towerOpen, pickTrial, trialOpen, albumCount, codexOf, codexPercent, heroOf, heroShots, nextBeat, questName, peopleOf, placesOf, rankOf, toYou, unlocked, type Beat, type Entry } from './progress.ts';
import { WELCOME, WORLD } from './world.ts';
import { CANTOS, PERILS, type Canto } from '../data/odyssey.ts';
import { Portrait } from './Portrait.tsx';
import { Trailer, TRAILER_SEEN } from './Trailer.tsx';
import { Journey } from './Journey.tsx';
import { CheckInBody, CheckInStrip, TrapRecordCard } from './CheckIn.tsx';
import { DiaryBody } from './Diary.tsx';
import { countdownText, daysLeft, examShown, examSubscribe } from './exam.ts';
import { DrillSheet } from './Drill.tsx';
import { openNotes } from './notes.ts';
import { drillCases } from './drill.ts';
import { reviewPlan } from './review.ts';
import { SprintCard } from './Sprint.tsx';
import { pickSprint, sprintOf } from './sprint.ts';
import { dayKey } from './streak.ts';

const CHAPTERS: Record<number, string> = { 1: '第一章', 2: '第二章', 3: '第三章', 4: '第四章', 5: '第五章' };

/** run：上次沒結案的那一張委託 */
interface Props { save: Save; run: Run | null; onHome(): void; onHero(id: string): void; onBeatSeen(id: string): void; onStart(c: CaseDef): void; onTrial(c: CaseDef): void; /** 終章的值班夜 */ onNight(): void; onTide(n: number): void; onResume(): void; onDropRun(): void; onImport(s: Save): void; onReset(): void; /** 航海日誌：某一天自己寫的一句 */ onNote(day: string, text: string): void }

/** 圖鑑裡的一張卡：遇到了、去過了才看得到 */
function Card({ e, wide }: { e: Entry; wide?: boolean }) {
  return (
    <div className={'card' + (wide ? ' wide' : '') + (e.open ? '' : ' locked')}>
      <Portrait shot={e.shot} label={e.name} locked={!e.open} wide={wide} />
      <div><b>{e.open ? e.name : '？？？'}</b><span>{e.open ? e.tag : e.hint}</span>{e.open && e.lines.map((l) => <p key={l}>{l}</p>)}</div>
    </div>
  );
}
/** 一篇篇章：吟遊詩人的開場、史詩的故事、這一篇的劫，和你在這幾劫遇過的人 */
function CantoBody({ k, save }: { k: Canto; save: Save }) {
  return <>
    <p className="invoke">「{k.invoke}」</p>
    {k.lines.map((t) => <p key={t}>{t}</p>)}
    {k.id === 'axes' && <Axes save={save} />}
    {k.perils.map((id) => {
      const pr = PERILS[id], m = COMPLAINTS.find((x) => x.id === id)!, met = QUESTS.map((q) => caseById(q.caseId)).filter((c) => c.complaint === id && save.cases[c.id]);
      return (
        <div key={id} className="leaf">
          <b>{pr.name}・{m.shadow.name}（{m.name}）</b>
          <p className="dim">{pr.myth}</p>
          <p>{pr.trap}</p>
          {met.length ? <ul className="path">{met.map((c) => <li key={c.id} className={save.beats.includes(PASSED(c.id)) ? 'up' : 'down'}>{c.patient.name}（{c.title}）：{save.beats.includes(PASSED(c.id)) ? '過了這一劫' : '還沒過；重接這一張再試'}</li>)}</ul>
            : <p className="dim">這一劫的委託，你還沒有接過。</p>}
        </div>
      );
    })}
  </>;
}
/** 十二斧之試：一種劫影一把斧頭，在它的試弓裡及格一次就亮 */
/** 試弓進場之前的閱題頁 */
function TrialBrief({ c }: { c: CaseDef }) {
  return (
    <>
      <p className="dim">正式考試在門口有 2 分鐘讀這一頁。這裡不計時：準備好了再進場，進場才開始倒數。</p>
      <h3>病人</h3>
      {c.reading.lines.map((l, i) => <p key={i}>{l}</p>)}
      <h3>你的角色和任務</h3>
      <p>你是考生，扮演專科護理師；病人由你獨立完成評估，口試委員在旁邊看，不給提示。</p>
      <p>順序：開場 → 主訴 → 病史 → 系統回顧 → 身體評估 → 說出診斷和要排除的診斷 → 提出檢查、向醫師回報、向病人說明 → 交卷。動手檢查之前，記得先向病人說明。</p>
      <h3>進門之前，先想三件事</h3>
      <ul>{c.reading.prompts.map((p, i) => <li key={i}>{p}</li>)}</ul>
    </>
  );
}

function Axes({ save }: { save: Save }) {
  const lit = axesLit(save);
  return <>
    <ol className="axes" aria-label={'十二把斧頭，亮了 ' + lit.length + ' 把'}>{COMPLAINTS.map((m) => <li key={m.id} className={save.beats.includes(AXE(m.id)) ? 'lit' : ''}><i aria-hidden="true" /><span>{m.shadow.name}</span></li>)}</ol>
    <p className="dim">亮了 {lit.length}／12 把。{lit.length < 12 ? '試弓會先抽還沒亮的那幾種。' : '十二把都亮了。'}</p>
  </>;
}
/** 三位主角。picked 是現在選的那一位 */
function HeroCards({ picked, onPick, action }: { picked: string | null; onPick(id: string): void; action: string }) {
  return (
    <div className="album">
      {HEROES.map((h) => (
        <div key={h.id} className={'card' + (picked === h.id ? ' on' : '')}>
          <Portrait shot={heroShots[h.id]} label={h.name} />
          <div><b>{h.name}</b><span>{h.tag}</span><p>{h.line}</p><p className="dim">直覺：{h.knack}<br />盲點：{h.blind}</p>{picked === h.id ? <em>現在是這一位</em> : <button type="button" className="pick" onClick={() => { sfx.tap(); onPick(h.id); }}>{action}</button>}</div>
        </div>
      ))}
    </div>
  );
}

export function Hall({ save, run, onHome, onHero, onBeatSeen, onStart, onTrial, onNight, onTide, onResume, onDropRun, onImport, onReset, onNote }: Props) {
  // 航海圖：哪幾座島去過了、每座島結了幾張。巡診船停在現在走到的那一章的島
  const isles: ChartIsle[] = (Object.keys(ISLANDS) as IslandId[]).map((id) => {
    const ch = ISLANDS[id].chapter, qs = questsOn(id);
    const marks = COMPLAINTS.filter((m) => islandOf({ complaint: m.id }) === id).map((m) => perilsPassed(m.id, save) > 0);
    const tag = COMPLAINTS.filter((m) => islandOf({ complaint: m.id }) === id).map((m) => m.name).join('、');
    return { id, open: chapterOpen(ch, save), done: qs.filter((q) => save.cases[q.caseId]).length, total: qs.length, fresh: qs.some((q) => unlocked(q, save) && !save.cases[q.caseId]), marks, tag };
  });
  const boat = ([...isles].reverse().find((i) => i.open && i.done < i.total) ?? isles[0]).id;
  const [isle, setIsle] = useState<IslandId>(boat);
  const [view, setView] = useState<IslandId | null>(null);   // null：地圖頁；一座島：那座島的症狀和委託
  const [pendingBeat, setBeat] = useState<Beat | null>(() => nextBeat(save) ?? null);
  // 先知道自己是誰，故事才開始：還沒選主角之前，序章先等著
  const beat = save.hero === null ? null : pendingBeat;
  const [welcomed, setWelcomed] = useState(() => save.hero !== null || save.beats.some((b) => b !== TRAILER_SEEN));
  // 前導片：第一次打開還沒看過的時候先播；圖鑑裡可以重看
  const [film, setFilm] = useState(() => save.hero === null && !save.beats.includes(TRAILER_SEEN));
  const [step, setStep] = useState(0);
  const [reading, setReading] = useState<CaseDef | null>(null);
  const [codex, setCodex] = useState(false);
  const [cal, setCal] = useState(false);   // 打卡日曆
  const [diary, setDiary] = useState(false);   // 航海日誌
  const [tab, setTab] = useState<'shadow' | 'epic' | 'people' | 'places' | 'world'>('shadow');
  const [soundOn, setSoundOn] = useState(sound.on);
  const [settings, setSettings] = useState(false);
  const [story, setStory] = useState<Beat | null>(null);   // 從圖鑑重看的那一段故事
  const [trialSheet, setTrialSheet] = useState(false);     // 試弓：先看規則，再抽題、閱題
  const [drawn, setDrawn] = useState<CaseDef | null>(null); // 抽到的那一位。抽了就不能重抽
  const [redo, setRedo] = useState<CaseDef | null>(null);   // 錯題複習：用試弓重考的那一位（不是抽的，關掉就放回去）
  const [drill, setDrill] = useState(false);   // 刻意練習
  const today = dayKey(Date.now()), plan = reviewPlan(save), due = plan.filter((r) => r.due <= today), soon = plan.filter((r) => r.due > today);
  const examOn = useSyncExternalStore(examSubscribe, examShown);
  // 考前衝刺：口試前兩週、試弓已經開放、沒有關掉口試倒數的時候才出現
  const sprint = examOn && trialOpen(save) ? sprintOf(save) : null;
  const pwa = useSyncExternalStore(pwaSubscribe, pwaState);
  const consent = useSyncExternalStore(statsSubscribe, statsConsent);
  const exam = examOn ? countdownText(daysLeft()) : null;   // 真實的口試日還有幾天
  const [later, setLater] = useState(false);   // 按了關閉：這一次先不問，下次打開再問
  const pending = run ? caseById(run.caseId) : null;
  const stage = useRef<StageHandle | null>(null), talk = useRef<TalkHandle>(null), speaker = useRef<Who | null>(null), bubble = useRef<HTMLDivElement>(null);
  const open = QUESTS.filter((q) => unlocked(q, save));
  // 終章走到哪裡：值班夜還沒走、燈塔那一張還沒接
  const ending = caseById(FINALE_ID), nightNew = finaleOpen(save) && !nightDone(save), towerNew = towerOpen(save) && !finaleDone(save);
  const fresh = open.find((q) => !save.cases[q.caseId]) ?? (nightNew || towerNew ? true : undefined);
  const todo = nextStep(save, run ? { caseId: run.caseId, trial: !!run.trial, closed: run.session.closedAt !== null } : null), side = run ? null : sideStep(save);
  const go = (a: NextAction) => {
    if (a.kind === 'resume') onResume();
    else if (a.kind === 'quest') { setIsle(a.island); setView(a.island); setReading(caseById(a.caseId)); }
    else if (a.kind === 'night') onNight();
    else if (a.kind === 'tower') setReading(ending);
    else if (a.kind === 'trial') setTrialSheet(true);
    else if (a.kind === 'tide') onTide(a.n);
    else setCodex(true);
  };

  useEffect(() => {
    if (save.hero === null) return;
    if (beat) { talk.current?.say([{ ...beat.lines[step], text: toYou(beat.lines[step].text, save.hero) }]); return; }
    const last = save.takeaways[0];
    if (pending && run!.trial) { talk.current?.say([{ who: 'mentor', text: run!.session.closedAt !== null ? '試煉交卷了，成績還沒看。' : '試弓考到一半。倒數會從你離開的時候接下去。' }]); return; }
    if (pending) { talk.current?.say([{ who: 'mentor', text: run!.session.closedAt !== null ? pending.patient.name + '那一張結案了，回顧還沒看完。' : pending.patient.name + '還在等你。上次做到一半，可以接著做。' }]); return; }
    talk.current?.say([{ who: 'mentor', text: last ? '你上次說，下次要做到：' + last : nightNew ? '板子最底下那一張，是今晚的。門口已經有人了。' : towerNew ? '最後一張，地點是燈塔。準備好了，我們就上去。' : fresh ? '委託板上有一張新的。準備好了就接。' : '板子上的委託都走過了。想再走一次也可以，圖鑑還有空白。' }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat, step, save.hero]);

  const endBeat = () => {
    if (!beat) return;
    onBeatSeen(beat.id);
    const seen = [...save.beats, beat.id], following = BEATS.find((b) => !seen.includes(b.id) && b.when(save)) ?? null;
    setBeat(following); setStep(0);
  };
  const next = () => {
    if (!beat) return;
    sfx.page();
    if (step + 1 >= beat.lines.length) endBeat(); else setStep(step + 1);
  };
  const onFrame = (s: StageHandle) => {
    const who = speaker.current, key = who === 'mentor' ? 'cen' : who === 'mo' ? 'mo' : who === 'doctor' ? 'shen' : null;
    s.state.talker = key; s.state.glow = !beat && fresh ? 1 : 0;
    s.state.fx = beat ? beat.lines[step]?.fx ?? '' : '';
    const at = key ? s.anchor(key) : null, b = bubble.current;
    if (b) { b.hidden = !at; if (at) { b.style.left = Math.round(at.x) + 'px'; b.style.top = Math.round(at.y) + 'px'; } }
  };

  return (
    <div className={'screen hall' + (!beat && save.hero !== null ? ' mapview' : '')}>
      <div className="left">
        <div className="top"><span className="who"><button type="button" className="home" onClick={() => { sfx.page(); onHome(); }}>‹ 首頁</button>公會大廳</span><span className="clock">{save.hero ? heroOf(save.hero).name + '・' : ''}{rankOf(save)}</span></div>
        <Stage kind="hall" hero={save.hero} stage={stage} onFrame={onFrame} label="公會的大廳：牆上是委託板，費民坐在櫃台後面寫字，孟拓站在委託板旁邊，窗外是霧港和燈塔">
          <div className="bubble" ref={bubble} hidden>…</div>
          {beat && <div className="chapter">{beat.title}</div>}
        </Stage>
      </div>
      <div className="right">
        <Talk ref={talk} onSpeaker={(w) => { speaker.current = w; }} onTap={next} more={!!beat} />
        <div className="panel">
          {beat ? (
            <div className="acts one">
              <p className="beat-note">故事：{beat.title}（{step + 1}／{beat.lines.length}）。看完會回到委託板，告訴你下一步。</p>
              <button type="button" className="act demo" onClick={() => (talk.current?.busy() ? talk.current.finish() : next())}>{step + 1 >= beat.lines.length ? '回到委託板' : '繼續（' + (step + 1) + '／' + beat.lines.length + '）'}</button>
              <button type="button" className="skip" onClick={endBeat}>跳過這一段</button>
            </div>
          ) : (
            <div className="quests">
              {pwa.update && <button type="button" className="quest paper hint" onClick={() => { sfx.done(); applyUpdate(); }}><i className="seal" aria-hidden="true" /><b>有新的版本</b><span>換上只要幾秒，進度不會動</span><em>現在更新</em></button>}
              {view ? <>
              {/* 島嶼頁：這座島的症狀（劫影）和它的委託 */}
              <button type="button" className="back" onClick={() => { sfx.page(); setView(null); }}>‹ 回地圖</button>
              {COMPLAINTS.filter((m) => islandOf({ complaint: m.id }) === isle).map((m) => (
                <div key={m.id} className="isle-head paper">
                  <b>{m.name}</b>
                  <span>{ISLANDS[isle].name}・{ISLANDS[isle].tag}・這裡的劫影叫{m.shadow.name}</span>
                  <p>這座島的病人都是因為「{m.name}」來的。一張委託就是一位病人：照考站的順序問診、身體評估、說出診斷和要排除的、提出檢查、向醫師回報、跟病人說明。</p>
                  {PERILS[m.id] && <p className="tip"><b>提示・這個症狀最容易犯的錯：</b>{PERILS[m.id].trap}</p>}
                </div>
              ))}
              {COMPLAINTS.map((m) => {
                const mine = QUESTS.filter((q) => caseById(q.caseId).complaint === m.id);
                if (!mine.length || islandOf({ complaint: m.id }) !== isle) return null;
                const seen = mine.some((q) => unlocked(q, save));
                return (
                  <Fragment key={m.id}>
                    <div className="quest-head">{seen ? m.name + '的委託（' + mine.filter((q) => save.cases[q.caseId]).length + '／' + mine.length + '）' : '還沒送到的委託'}</div>
                    {mine.map((q) => {
                      const c = caseById(q.caseId), res = save.cases[c.id];
                      if (!unlocked(q, save)) return <div key={c.id} className="quest paper locked" aria-disabled="true"><b>？？？</b><span>{q.chapter > 1 && !seen ? CHAPTERS[q.chapter - 1] + '走完之後才會送到' : '完成上一張委託之後才會送到'}</span><em>還沒出現</em></div>;
                      return (
                        <button key={c.id} type="button" className={'quest paper' + (res ? '' : ' hint')} onClick={() => { sfx.page(); setReading(c); }}>
                          <i className="seal" aria-hidden="true" />
                          <b>{questName(c, !!res)}</b>
                          <span>{res ? c.patient.name + '｜' : ''}{c.complaintName}{placeOf(c.scene) === 'dock' ? '｜出診' : ''}</span>
                          <em>{res ? '最佳 ' + res.best + ' 分・' + SAFETY_LABEL[res.safety] : '新的委託'}</em>
                        </button>
                      );
                    })}
                  </Fragment>
                );
              })}
              {(() => {
                // 海神的風暴：一章一場，放在那一章有長老的那座島；還沒輪到的不擺出來
                const n = ISLANDS[isle].chapter, seen = save.beats.includes(TIDE_DONE(n));
                if (!ISLANDS[isle].elder || !chapterDone(n, save)) return null;
                return <button type="button" className={'quest paper' + (seen ? '' : ' hint')} onClick={() => { sfx.page(); onTide(n); }}><i className="seal" aria-hidden="true" /><b>{TIDES[n].title}</b><span>推演：這一章的兩位同一刻到門口，先看誰、怎麼交代</span><em>{seen ? '走過了・可以再走' : '選做'}</em></button>;
              })()}
              {/* 篇章：在那座島結過一張委託才出現（選讀） */}
              {CANTOS.filter((k) => k.island === isle && questsOn(isle).some((q) => save.cases[q.caseId])).map((k) => (
                <details key={k.id} className="canto paper"><summary><b>{k.no}　{k.title}</b><span>這座島的史詩・選讀</span></summary><CantoBody k={k} save={save} /></details>
              ))}
              </> : <>
              {/* 地圖頁：先看進度和下一步，再點一座島 */}
              <div className="next paper" role="region" aria-label="下一步">
                <Journey save={save} compact />
                <CheckInStrip save={save} onOpen={() => setCal(true)} />
                <span className="next-label">下一步</span>
                <b>{todo.title}</b>
                <p>{todo.why}</p>
                <button type="button" className="act demo" onClick={() => { sfx.page(); go(todo.action); }}>{todo.button}</button>
                {pending && run && run.session.closedAt === null && <button type="button" className="skip" onClick={() => { sfx.miss(); onDropRun(); }}>{run.trial ? '不考了，放掉這一場' : '不接了，放掉這一張'}</button>}
              </div>
              {sprint && <SprintCard save={save} sprint={sprint} due={due.length} onDraw={() => { if (!drawn) setDrawn(pickSprint(save, Math.random())); setTrialSheet(true); }} />}
              {side && <div className="side"><span>{side.text}</span><button type="button" className="pick" onClick={() => { sfx.page(); go(side.action); }}>{side.button}</button></div>}
              <div className="map-help">
                <p><b>地圖：一座島一種症狀。</b>島名是故事裡的地名，底下寫的是那裡的病人來看什麼（例如「胸痛 1/4」）。點有名字的島，看那裡的委託。</p>
                <button type="button" className="pick" onClick={() => { sfx.page(); setFilm(true); }}>看前導片（60 秒）</button>
              </div>
              <SeaChart isles={isles} picked={boat} boat={boat} home={finaleDone(save)} onPick={(id) => { setIsle(id); setView(id); }} />
              {finaleOpen(save) && <>
                <div className="quest-head">終章　大霧值班夜</div>
                <button type="button" className={'quest paper' + (nightNew ? ' hint' : '')} onClick={() => { sfx.page(); onNight(); }}><i className="seal" aria-hidden="true" /><b>值班夜</b><span>門口同時有兩三位：先看誰、怎麼交代、什麼時候回頭</span><em>{nightDone(save) ? '走過了・可以再走' : '今晚'}</em></button>
                {towerOpen(save) && <button type="button" className={'quest paper' + (towerNew ? ' hint' : '')} onClick={() => { sfx.page(); setReading(ending); }}><i className="seal" aria-hidden="true" /><b>{questName(ending, !!save.cases[FINALE_ID])}</b><span>{save.cases[FINALE_ID] ? ending.patient.name + '｜' : ''}{ending.complaintName}｜燈塔</span><em>{save.cases[FINALE_ID] ? '最佳 ' + save.cases[FINALE_ID].best + ' 分・' + SAFETY_LABEL[save.cases[FINALE_ID].safety] : '最後一張'}</em></button>}
              </>}
              {trialOpen(save) && <>
                <div className="quest-head">驗收{exam ? '・' + exam : ''}</div>
                <button type="button" className="quest paper" onClick={() => { sfx.page(); setTrialSheet(true); }}><i className="seal" aria-hidden="true" /><b>試弓</b><span>抽一位病人，15 分鐘倒數，沒有提示</span><em>{save.trials.length ? '最高 ' + Math.max(...save.trials.map((t) => t.score)) + ' 分・考過 ' + save.trials.length + ' 次' : '還沒考過'}</em></button>
              </>}
              {plan.length > 0 && <>
                <div className="quest-head">錯題複習</div>
                {due.map((r) => { const c = caseById(r.caseId); return (
                  <button key={r.caseId} type="button" className="quest paper hint" onClick={() => { sfx.page(); if (r.trial) setRedo(c); else setReading(c); }}><i className="seal" aria-hidden="true" /><b>{c.patient.name}（{c.complaintName}）</b><span>{r.why.wrong ? '診斷沒有對到' : ''}{r.why.wrong && r.why.trapped ? '，也' : ''}{r.why.trapped ? '掉進了陷阱' : ''}・{r.trial ? '用試弓重考' : '重接這張委託'}</span><em>第 {r.round} 次複習</em></button>
                ); })}
                {!due.length && <div className="side"><span>今天沒有要複習的。下一次：{soon[0].due.slice(5).replace('-', '/')}，{soon.filter((r) => r.due === soon[0].due).length} 位。</span></div>}
                {due.length > 0 && soon.length > 0 && <div className="side"><span>之後還有 {soon.length} 位，到期再出現。</span></div>}
              </>}
              {drillCases(save).length > 0 && <>
                <div className="quest-head">刻意練習</div>
                <button type="button" className="quest paper" onClick={() => { sfx.page(); setDrill(true); }}><i className="seal" aria-hidden="true" /><b>一次只練一個環節</b><span>線索解讀・問題摘要・回報的評估，每題馬上有回饋</span><em>不計分</em></button>
                <button type="button" className="quest paper" onClick={() => { sfx.page(); openNotes(); }}><i className="seal" aria-hidden="true" /><b>考前速記頁</b><span>十二種主訴：鑑別方向、重點評估、陷阱、每位病人的教學重點</span><em>可列印</em></button>
              </>}
              {finaleDone(save) && <><div className="quest-head">十二斧之試</div><div className="paper axes-card"><Axes save={save} /></div></>}
              {CANTOS.filter((k) => !k.island && cantoOpen(k.id, save)).map((k) => (
                <details key={k.id} className="canto paper"><summary><b>{k.no}　{k.title}</b><span>史詩的篇章・選讀</span></summary><CantoBody k={k} save={save} /></details>
              ))}
              </>}
            </div>
          )}
        </div>
        <div className="foot">
          <button type="button" onClick={() => { sfx.page(); setCodex(true); }}>圖鑑 {codexPercent(COMPLAINTS, save)}%</button>
          <button type="button" onClick={() => { sfx.page(); setDiary(true); }}>日誌</button>
          <button type="button" onClick={() => { sound.on = !sound.on; setSoundOn(sound.on); }}>聲音：{soundOn ? '開' : '關'}</button>
          <button type="button" onClick={() => { sfx.page(); setSettings(true); }}>設定{pwa.update ? '・有新版' : ''}</button>
        </div>
      </div>

      {reading && (
        <Sheet title={'委託：' + (save.cases[reading.id] ? reading.title : reading.patient.name + '，' + reading.complaintName)} onClose={() => setReading(null)} footer={<button type="button" className="act demo" onClick={() => onStart(reading)}>{placeOf(reading.scene) === 'tower' ? '接下委託，上燈塔' : '接下委託，進病室'}</button>}>
          <p className="dim">地點：{whereOf(reading.scene, homeOf(reading))}</p>
          <h3>病人</h3>
          {reading.reading.lines.map((l, i) => <p key={i}>{l}</p>)}
          <h3>你的角色和任務</h3>
          <p>你是公會的{rankOf(save)}。這位病人由你先看；孟拓（資深專科護理師）在旁邊，馬凱醫師值班。</p>
          <ol>
            <li>問診：主訴、病史、系統回顧。</li>
            <li>身體評估：先量生命徵象；每一項動手之前先向病人說明。</li>
            <li>說出最可能的診斷，和還要排除的診斷。</li>
            <li>提出需要的檢查，向馬凱醫師回報（檢查和用藥由醫師決定）。</li>
            <li>用病人聽得懂的話向病人說明，然後結案。</li>
          </ol>
          <h3>進門之前，先想三件事</h3>
          <ul>{reading.reading.prompts.map((p, i) => <li key={i}>{p}</li>)}</ul>
          {/* 操作的說明只有還沒結過案的人需要整段攤開；之後收成一行，要看再點開 */}
          <details className="how" open={!Object.keys(save.cases).length}>
          <summary>畫面怎麼操作</summary>
          <ul>
            <li>下面一排是順序：開場 → 主訴 → 病史 → 系統回顧 → 評估 → 診斷 → 檢查。前面的隨時可以回去補；後面的要做完前一段才會打開。</li>
            <li>畫面上的四盞燈，是這個主訴的四個鑑別診斷。問到或檢查到重要的線索，遊戲會停下來問你：這條線索讓哪一個診斷更像，或是比較不像。答對了，那一盞燈會變亮或變暗。</li>
            <li>「穩定度」是病人現在的狀況，會跟著時間和你做的事變化。「未釐清」是離診斷還有多遠：線索判斷對了，數字就往下掉，畫面上的霧也會散一點。</li>
            <li>時間只在你做事（問一題、做一項檢查）的時候走。看字、想事情、下診斷都不算時間。</li>
            <li>病人等不了的時候，按「緊急通報」（敲值班鐘），醫師會馬上過來；病人穩定就不用按，照順序做到最後再「向醫師回報」。不知道下一步的時候，按「要提示」，孟拓會告訴你。</li>
            <li>一張委託大約 10 到 12 分鐘。</li>
          </ul>
          </details>
          <p className="dim">{reading.review.note}</p>
        </Sheet>
      )}
      {trialSheet && !drawn && (
        <Sheet title="試弓" onClose={() => setTrialSheet(false)} footer={<button type="button" className="act demo" onClick={() => { sfx.page(); setDrawn(pickTrial(save, Math.random())); }}>抽題</button>}>
          <p>照甄審口試的條件，完整走一次。</p>
          <ul>
            <li><b>用抽的。</b>四十八位病人都可能出，包括你還沒遇過的。抽了就不能重抽。</li>
            <li><b>站內 15 分鐘，照真的時間倒數。</b>看字、想事情的時間也算。剩 3 分鐘會提醒；時間到，手上有什麼就交什麼。</li>
            <li><b>沒有提示。</b>孟拓不在；線索判讀得對不對，當下不會告訴你；劫影和四盞燈都收起來。</li>
            <li><b>交卷之後才有成績和回顧。</b>{TRIAL_PASS} 分及格（115 年度甄審的規定）。</li>
            <li>不會寫進圖鑑，也不算完成委託。之後在委託板遇到同一位病人，會覺得眼熟，這沒有關係。</li>
            {finaleDone(save) && <li><b>十二斧之試。</b>在一種劫影的試弓裡及格一次，那一把斧頭就亮；還沒亮的那幾種，比較容易抽到。現在亮了 {axesLit(save).length}／12 把。</li>}
          </ul>
          <p className="dim">遊戲的分數是訓練用的，不代表正式甄審的成績。病例依文獻與臨床指引撰寫，僅供練習，不能取代臨床判斷。</p>
          {save.trials.length > 0 && <>
            <h3>考過的</h3>
            <ul className="path">{save.trials.slice(0, 6).map((t) => <li key={t.at} className={t.score >= TRIAL_PASS ? 'up' : 'down'}><b>{new Date(t.at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}</b>　{caseById(t.caseId).patient.name}（{caseById(t.caseId).complaintName}）：{t.score} 分，{t.timeUp ? '時間到' : '用了 ' + Math.floor(t.seconds / 60) + ' 分'}</li>)}</ul>
          </>}
        </Sheet>
      )}
      {trialSheet && drawn && (
        <Sheet title="試弓：閱題" onClose={() => setTrialSheet(false)} footer={<button type="button" className="act demo" onClick={() => { const c = drawn; setDrawn(null); setTrialSheet(false); onTrial(c); }}>進場，開始倒數</button>}>
          <TrialBrief c={drawn} />
        </Sheet>
      )}
      {redo && (
        <Sheet title="錯題複習：閱題" onClose={() => setRedo(null)} footer={<button type="button" className="act demo" onClick={() => { const c = redo; setRedo(null); onTrial(c); }}>進場，開始倒數</button>}>
          <p className="dim">上次這一位沒有過關。隔了幾天再考一次，規則和試弓一樣：15 分鐘、沒有提示。</p>
          <TrialBrief c={redo} />
        </Sheet>
      )}
      {drill && <DrillSheet save={save} onClose={() => setDrill(false)} />}
      {settings && <Settings save={save} onImport={onImport} onReset={onReset} onReplayIntro={() => { setSettings(false); setBeat(BEATS[0]); setStep(0); }} onClose={() => setSettings(false)} />}
      {statsBuilt && consent === 'ask' && !later && !beat && save.hero !== null && !settings && !reading && !codex && (
        <Sheet title="先問你一件事" onClose={() => setLater(true)} footer={<div className="two"><button type="button" className="act" onClick={() => { sfx.tap(); setConsent('no'); }}>不要回傳</button><button type="button" className="act demo" onClick={() => { sfx.done(); setConsent('yes'); }}>可以回傳</button></div>}>
          <p>可以讓這個遊戲回傳<b>匿名的使用統計</b>嗎？</p>
          <StatsFacts />
          <p className="dim">之後想改，在「設定」裡。你選之前，什麼都不會送出去。</p>
        </Sheet>
      )}
      {save.hero === null && !welcomed && !settings && (
        <Sheet title="歸航記" onClose={() => setWelcomed(true)} footer={<button type="button" className="act demo" onClick={() => { sfx.page(); setWelcomed(true); }}>開始</button>}>
          <p>{WELCOME.what}</p>
          <dl className="pairs">{WELCOME.points.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <p className="dim">{WELCOME.note}</p>
        </Sheet>
      )}
      {save.hero === null && welcomed && !settings && (
        <Sheet title="你是哪一位？" onClose={() => onHero(HEROES[0].id)}>
          <p>你剛結束訓練，今天第一天到公會報到。選一位當你自己。</p>
          <p className="dim">六位都是見習專科護理師。只有來歷、外表和帶的東西不同，能做的事一模一樣；之後可以在圖鑑的「人物」裡換。</p>
          <HeroCards picked={null} onPick={onHero} action="就是這一位" />
        </Sheet>
      )}
      {cal && <Sheet title="打卡" onClose={() => setCal(false)}><CheckInBody save={save} /><button type="button" className="pick" onClick={() => { sfx.page(); setCal(false); setDiary(true); }}>看航海日誌：每一天做了什麼</button></Sheet>}
      {diary && <Sheet title="航海日誌" onClose={() => setDiary(false)}><DiaryBody save={save} onNote={onNote} /></Sheet>}
      {codex && (
        <Sheet title="圖鑑" onClose={() => setCodex(false)}>
          <div className="steps five" role="tablist">
            {([['shadow', '劫影'], ['epic', '史詩'], ['people', '人物'], ['places', '場景'], ['world', '公會']] as const).map(([id, name]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => { sfx.tap(); setTab(id); }}>{name}</button>)}
          </div>
          {tab === 'people' && (() => {
            const { guild, elders, patients } = peopleOf(save);
            return <>
              <p className="dim">遇到的人會記在這裡。人物和場景一共 {albumCount(save).total} 張，你打開了 {albumCount(save).got} 張。</p>
              <h3>主角</h3>
              <HeroCards picked={save.hero} onPick={onHero} action="換成這一位" />
              <h3>公會的人</h3>
              <div className="album">{guild.map((e) => <Card key={e.id} e={e} />)}</div>
              <h3>五島長老會</h3>
              <p className="dim">本島和四片海最大的那座島，各一位老醫生。病室裡卡住的時候可以請教他們（第二章起），但每一位都有不提的地方。</p>
              <div className="album">{elders.map((e) => <Card key={e.id} e={e} />)}</div>
              <h3>照顧過的人</h3>
              <div className="album">{patients.map((e) => <Card key={e.id} e={e} />)}</div>
            </>;
          })()}
          {tab === 'world' && <>
            {WORLD.paragraphs.map((t) => <p key={t}>{t}</p>)}
            <h3>看過的故事</h3>
            {save.beats.length ? <div className="stack">{BEATS.filter((b) => save.beats.includes(b.id)).map((b) => <button key={b.id} type="button" className="pick" onClick={() => { sfx.page(); setStory(b); }}>{b.title}</button>)}</div> : <p className="dim">還沒有。</p>}
            <h3>舊檔案</h3>
            <p className="dim">費民從淹過水的櫃子裡，一頁一頁晾乾的值班日誌。是誰寫的、寫的是哪一年，故事走到了才知道。不讀也不影響委託。</p>
            {ARCHIVE.map((l) => (l.when(save)
              ? <div key={l.id} className="leaf"><b>{l.day}</b>{l.lines.map((t) => <p key={t}>{t}</p>)}</div>
              : <div key={l.id} className="leaf locked"><b>？？？</b><p className="dim">{l.hint}</p></div>))}
            <h3>這裡的東西，對到現實的什麼</h3>
            <dl className="pairs">{WORLD.map.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <button type="button" className="pick" onClick={() => { sfx.page(); setCodex(false); setFilm(true); }}>看前導片（60 秒）</button>
            <h3>這是什麼</h3>
            <p>{WELCOME.what}</p>
            <p className="dim">{WELCOME.note}</p>
          </>}
          {tab === 'epic' && <>
            <p className="dim">這個遊戲的故事，借的是荷馬史詩《奧德賽》：一個人在海上漂流很久，一關一關認出眼前的危險，最後回到家。每一座島是一篇；每一種劫影，是一段海上的試煉。病室裡不講這些，回顧的時候才會告訴你，這一劫你有沒有被困住。</p>
            {CANTOS.map((k) => cantoOpen(k.id, save)
              ? <details key={k.id} className="canto paper"><summary><b>{k.no}　{k.title}</b><span>{k.perils.length ? k.perils.map((id) => PERILS[id].name).join('、') : k.id === 'axes' ? '亮了 ' + axesLit(save).length + '／12 把' : '終章'}</span></summary><CantoBody k={k} save={save} /></details>
              : <div key={k.id} className="leaf locked"><b>{k.no}　？？？</b><p className="dim">{k.island ? CHAPTERS[ISLANDS[k.island].chapter] + '開始之後' : '終章走完之後'}</p></div>)}
            <p className="dim">劫的陷阱是依臨床推理常見的錯誤寫的，陷阱的名字和出處在每一張委託的回顧裡。</p>
          </>}
          {tab === 'places' && <>
            <p className="dim">去過的地方會記在這裡。一座島一間公會的診間，在那座島結過一張委託才會打開；出診的委託，會帶你到公會以外的地方。</p>
            <div className="album">{placesOf(save).map((e) => <Card key={e.id} e={e} wide />)}</div>
          </>}
          {tab === 'shadow' && <>
            <TrapRecordCard save={save} />
          <p className="dim">檔案室淹水之後，圖鑑只剩劫影的外形。底下的字，要靠你在一張一張委託裡寫回來。</p>
          {COMPLAINTS.map((m) => {
            const page = codexOf(m, save);
            return (
              <div key={m.id} className="codex">
                <div className="codex-top"><b>{m.shadow.name}</b><span>{m.name}的劫影</span><em>寫回 {page.percent}%</em></div>
                <i className="bar"><b style={{ width: page.percent + '%' }} /></i>
                <p>{m.shadow.lore}</p>
                {PERILS[m.id] && <p className="dim">{PERILS[m.id].name}：{PERILS[m.id].trap}{perilsPassed(m.id, save) ? '（過了 ' + perilsPassed(m.id, save) + ' 位）' : ''}</p>}
                <h3>四個診斷</h3>
                {page.forms.map(({ form, seenIn, reads, known }) => (
                  <div key={form.id} className={'form-card' + (known ? '' : ' unknown')}>
                    <div><i className="mark" aria-hidden="true">{known ? form.mark : '？'}</i><b>{known ? form.name : '還沒寫回來'}</b>{seenIn.length > 0 && <em>在{seenIn.join('、')}身上確認過</em>}</div>
                    {known && <p className="dim">{form.blurb}</p>}
                    {reads.length > 0 && <ul>{reads.map((r) => <li key={r.clue + r.who} className={r.dir > 0 ? 'up' : 'down'}>{r.dir > 0 ? '＋' : '－'} {r.text}<small>（{r.who}）</small></li>)}</ul>}
                  </div>
                ))}
                <h3>遇過的人</h3>
                {page.people.length ? page.people.map(({ c, rec }) => <p key={c.id} className="quote"><b>{c.patient.name}</b>，{c.patient.job}。{rec.found ? '你的診斷是對的。' : '還沒有診斷對過。'}{rec.concern ? '你回應了' + c.patient.pronoun + '最在意的事。' : ''}</p>) : <p className="dim">還沒有。完成第一張委託，才會有第一筆紀錄。</p>}
                <p className="dim">這一頁有 {page.cases.length} 位病人、{page.total} 條可以解讀的線索，你寫回了 {page.got} 條。</p>
              </div>
            );
          })}
          {save.takeaways.length > 0 && <><h3>你寫下的話</h3><ul>{save.takeaways.map((t) => <li key={t}>{t}</li>)}</ul></>}
          </>}
        </Sheet>
      )}
      {film && <Trailer onDone={() => { setFilm(false); if (!save.beats.includes(TRAILER_SEEN)) onBeatSeen(TRAILER_SEEN); }} />}
      {story && (
        <Sheet title={story.title} onClose={() => setStory(null)}>
          {story.lines.map((l, i) => (l.who === 'sys' ? <p key={i} className="dim">{toYou(l.text, save.hero)}</p>
            : <p key={i}><b className="name">{l.who === 'you' ? '你' : l.who === 'mo' ? '費民' : l.who === 'doctor' ? '馬凱' : l.who === 'guest' ? l.name : '孟拓'}</b>「{toYou(l.text, save.hero)}」</p>))}
        </Sheet>
      )}
    </div>
  );
}
