// 遊戲的首頁：打開遊戲先到這裡。開始或繼續、登入與同步、設定、這是什麼。
import { useRef, useState, useSyncExternalStore } from 'react';
import { caseById } from '../data/index.ts';
import { Stage, type StageHandle } from './Stage.tsx';
import { Sheet } from './Sheets.tsx';
import { Settings } from './Settings.tsx';
import { AccountPanel } from './Account.tsx';
import { sfx, sound } from './sound.ts';
import type { Run, Save } from './store.ts';
import { QUESTS, heroOf, rankOf } from './progress.ts';
import { applyUpdate, pwaState, pwaSubscribe } from './pwa.ts';
import { PROVIDER_NAME, accountState, accountSubscribe, cameBack } from './account.ts';
import { WELCOME } from './world.ts';
import { ReportSheet } from './Report.tsx';
import { openPrivacy } from './PrivacyPage.tsx';
import { EXAM, countdownText, daysLeft, examShown, examSubscribe } from './exam.ts';

interface Props { save: Save; run: Run | null; onPlay(): void; onImport(s: Save): void; onReset(): void }

export function Title({ save, run, onPlay, onImport, onReset }: Props) {
  const stage = useRef<StageHandle | null>(null);
  const pwa = useSyncExternalStore(pwaSubscribe, pwaState);
  const acct = useSyncExternalStore(accountSubscribe, accountState);
  const exam = useSyncExternalStore(examSubscribe, examShown) ? countdownText(daysLeft()) : null;   // 真實的口試日還有幾天
  // 剛登入完被送回來：直接打開帳號那一頁，讓人看到結果
  const [sheet, setSheet] = useState<null | 'account' | 'settings' | 'about' | 'report'>(() => (cameBack() ? 'account' : null));
  const [soundOn, setSoundOn] = useState(sound.on);
  const started = save.hero !== null || save.beats.length > 0 || Object.keys(save.cases).length > 0;
  const done = QUESTS.filter((q) => save.cases[q.caseId]).length, pending = run ? caseById(run.caseId) : null;
  const canSignIn = acct.providers.length > 0 || !!acct.account;
  const open = (s: 'account' | 'settings' | 'about' | 'report') => { sfx.page(); setSheet(s); };

  return (
    <div className="screen title">
      <div className="left">
        <header className="title-head">
          <h1>霧脈公會</h1>
          <p>專科護理師口試的練習</p>
          {exam && <p className="exam" role="note"><b>{exam}</b><span>{EXAM.label}</span></p>}
        </header>
        <Stage kind="title" hero={save.hero} stage={stage} label="入夜的霧港：燈塔的光掃過海面，霧一團一團飄過去，其中一團長出了眼睛；碼頭上掛著四盞燈" />
      </div>
      <div className="right">
        <nav className="menu" aria-label="主選單">
          {pwa.update && <button type="button" className="quest paper hint" onClick={() => { sfx.done(); applyUpdate(); }}><i className="seal" aria-hidden="true" /><b>有新的版本</b><span>換上只要幾秒，進度不會動</span><em>現在更新</em></button>}
          <button type="button" className="act demo big" onClick={() => { sfx.page(); onPlay(); }}>
            {started ? '繼續遊戲' : '開始遊戲'}
            <small>{!started ? '第一次來，從報到開始' : pending ? pending.patient.name + '那一張還沒結案' : (save.hero ? heroOf(save.hero).name + '・' : '') + rankOf(save) + '｜完成 ' + done + '／' + QUESTS.length + ' 張委託'}</small>
          </button>
          {canSignIn && <button type="button" className="act" onClick={() => open('account')}>
            {acct.account ? '帳號與同步' : '登入・同步進度'}
            <small>{acct.account ? '用 ' + PROVIDER_NAME[acct.account.provider] + ' 登入中' + (acct.sync === 'busy' ? '，同步中……' : acct.sync === 'fail' ? '，剛才沒有同步成功' : '') : '換手機、換瀏覽器也接得上。不登入也可以玩'}</small>
          </button>}
          <button type="button" className="act" onClick={() => open('settings')}>設定與進度<small>匯出匯入、裝到手機、版本{pwa.update ? '（有新版）' : ''}</small></button>
          <button type="button" className="act" onClick={() => open('about')}>關於這個遊戲<small>這是什麼、怎麼玩、要注意什麼</small></button>
        </nav>
        <div className="foot">
          <span>版本 {__BUILD__}</span>
          <button type="button" onClick={() => { sound.on = !sound.on; setSoundOn(sound.on); }}>聲音：{soundOn ? '開' : '關'}</button>
        </div>
      </div>

      {sheet === 'account' && <Sheet title="登入與同步" onClose={() => setSheet(null)}><AccountPanel /></Sheet>}
      {sheet === 'settings' && <Settings save={save} onImport={onImport} onReset={onReset} onClose={() => setSheet(null)} />}
      {sheet === 'report' && <ReportSheet place="title" onClose={() => setSheet(null)} />}
      {sheet === 'about' && (
        <Sheet title="關於這個遊戲" onClose={() => setSheet(null)} footer={<button type="button" className="act demo" onClick={() => { sfx.page(); setSheet(null); onPlay(); }}>{started ? '繼續遊戲' : '開始遊戲'}</button>}>
          <p>{WELCOME.what}</p>
          <dl className="pairs">{WELCOME.points.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <h3>要注意的事</h3>
          <ul>
            <li><b>病例都還是草稿，還沒有經過臨床老師審查。</b>可以拿來練流程和思考的順序，不能當成教材或臨床的依據。</li>
            <li>地方和人物是虛構的；症狀、評估、診斷和檢查都照真的來。</li>
            <li>進度存在這台裝置上。想換裝置，可以登入同步，或是到「設定與進度」匯出一份。</li>
            <li>第一次打開要有網路；之後沒有網路也可以玩。</li>
          </ul>
          <h3>這個遊戲用到的</h3>
          <p className="dim">圖是用程式一筆一筆畫的。字體是 LXGW WenKai TC（SIL Open Font License 1.1）。</p>
          <div className="stack">
            {acct.backend && <button type="button" className="pick" onClick={() => open('report')}>回報問題或建議</button>}
            <button type="button" className="pick" onClick={() => { sfx.page(); openPrivacy(); }}>隱私說明</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
