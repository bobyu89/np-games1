// 設定與進度：進度怎麼帶走（登入同步，或匯出匯入）、怎麼裝到手機、現在是哪一版，都放在這一頁。
import { useRef, useState, useSyncExternalStore } from 'react';
import { CASES, COMPLAINTS } from '../data/index.ts';
import { Sheet } from './Sheets.tsx';
import { sfx } from './sound.ts';
import type { Save } from './store.ts';
import { packSave, readBackup } from './backup.ts';
import { QUESTS, codexPercent, rankOf } from './progress.ts';
import { applyUpdate, checkUpdate, install, isIos, isStandalone, pwaState, pwaSubscribe } from './pwa.ts';
import { setConsent, statsBuilt, statsConsent, statsSubscribe } from './stats.ts';
import { AccountPanel } from './Account.tsx';
import { accountState, accountSubscribe } from './account.ts';
import { ReportSheet } from './Report.tsx';
import { openPrivacy } from './PrivacyPage.tsx';

const doneOf = (s: Save) => QUESTS.filter((q) => s.cases[q.caseId]).length;
const brief = (s: Save) => '完成 ' + doneOf(s) + '／' + QUESTS.length + ' 張委託，圖鑑寫回 ' + codexPercent(COMPLAINTS, s) + '%，' + rankOf(s);
const day = (d: Date) => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');

interface Props { save: Save; onImport(s: Save): void; onReset(): void; onReplayIntro?(): void; onClose(): void }

export function Settings({ save, onImport, onReset, onReplayIntro, onClose }: Props) {
  const pwa = useSyncExternalStore(pwaSubscribe, pwaState);
  const consent = useSyncExternalStore(statsSubscribe, statsConsent);
  const acct = useSyncExternalStore(accountSubscribe, accountState);
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [code, setCode] = useState<string | null>(null);        // 存不了檔案的時候，把內容攤開讓人複製
  const [paste, setPaste] = useState<string | null>(null);      // 貼上進度的那一格。null 是還沒打開
  const [incoming, setIncoming] = useState<{ save: Save; at: string | null; dropped: number } | null>(null);
  const [sure, setSure] = useState(false);
  const [report, setReport] = useState(false);
  const [checking, setChecking] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const say = (text: string, bad = false) => setNote({ text, bad });

  const exportSave = async () => {
    sfx.tap();
    const text = packSave(save, __BUILD__), name = '霧脈公會進度-' + day(new Date()) + '.json';
    try {
      const f = new File([text], name, { type: 'application/json' });
      // 手機：交給系統的分享（存到檔案、傳給自己）。桌機：直接下載
      if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], title: '霧脈公會進度' }); say('交給系統了。存好之後，到另一台裝置按「匯入進度」。'); return; }
      const url = URL.createObjectURL(f), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      say('已經存成檔案：' + name + '。如果沒有看到下載，改用「匯出進度（複製文字）」。');
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return;   // 自己按了取消
      setCode(text); say('這裡存不了檔案。把下面整段複製起來，貼到另一台裝置的「匯入進度」。', true);
    }
  };
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); say('複製好了。'); } catch { say('自動複製沒有成功。請長按那一段文字，全選之後複製。', true); }
  };
  const read = (text: string) => {
    const r = readBackup(text, CASES);
    if (!r.ok) { say(r.why, true); return; }
    setNote(null); setIncoming({ save: r.save, at: r.at, dropped: r.dropped });
  };
  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    try { read(await f.text()); } catch { say('這個檔案讀不出來。', true); }
    if (file.current) file.current.value = '';
  };
  const check = async () => {
    setChecking(true);
    const found = await checkUpdate();
    setChecking(false);
    if (!found) say(navigator.onLine === false ? '現在沒有網路，沒辦法檢查。' : '已經是最新的版本。');
  };

  if (incoming) {
    return (
      <Sheet title="匯入這份進度？" onClose={() => setIncoming(null)} footer={<button type="button" className="act urgent" onClick={() => { sfx.done(); onImport(incoming.save); setIncoming(null); setPaste(null); say('匯入好了。'); }}>匯入，蓋掉這台裝置上的進度</button>}>
        <p><b>要匯入的：</b>{brief(incoming.save)}。{incoming.at ? '匯出的時間是 ' + new Date(incoming.at).toLocaleString('zh-TW', { hour12: false }) + '。' : ''}</p>
        <p><b>這台裝置上現在的：</b>{brief(save)}。</p>
        {incoming.dropped > 0 && <p className="dim">裡面有 {incoming.dropped} 筆是這一版沒有的病例，會略過。</p>}
        <p className="dim">匯入之後，這台裝置上現在的進度會被蓋掉，沒辦法復原。不確定的話，先按右上角關掉，把現在的進度匯出一份。</p>
      </Sheet>
    );
  }
  if (report) return <ReportSheet place="settings" onClose={() => setReport(false)} />;
  const standalone = isStandalone();
  return (
    <Sheet title="設定與進度" onClose={onClose}>
      <h3>進度</h3>
      <p>{brief(save)}。</p>
      <p className="dim">{acct.account ? '進度存在這台裝置上，雲端也有一份（見下面的「登入與同步」）。' : '進度存在這台裝置的這個瀏覽器裡。清除瀏覽器資料、換瀏覽器或換裝置，進度不會跟著走；可以登入同步，或是先匯出一份帶過去。'}</p>
      <div className="stack">
        <button type="button" className="pick" onClick={exportSave}>匯出進度（存成檔案）</button>
        <button type="button" className="pick" onClick={() => { sfx.tap(); const t = packSave(save, __BUILD__); setCode(code === null ? t : null); setPaste(null); }}>匯出進度（複製文字）</button>
        <button type="button" className="pick" onClick={() => { sfx.tap(); file.current?.click(); }}>匯入進度（選檔案）</button>
        <button type="button" className="pick" onClick={() => { sfx.tap(); setPaste(paste === null ? '' : null); setCode(null); }}>匯入進度（貼上文字）</button>
      </div>
      <input ref={file} type="file" accept="application/json,.json,text/plain" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
      {code !== null && <>
        <textarea className="code" readOnly value={code} rows={5} aria-label="進度的內容" onFocus={(e) => e.target.select()} />
        <button type="button" className="pick" onClick={() => copy(code)}>複製這一段</button>
      </>}
      {paste !== null && <>
        <textarea className="code" value={paste} rows={5} aria-label="貼上匯出的進度" placeholder="把匯出的那一整段貼在這裡" onChange={(e) => setPaste(e.target.value)} />
        <button type="button" className="pick" disabled={!paste.trim()} onClick={() => read(paste)}>讀取</button>
      </>}
      {note && <p className={'note' + (note.bad ? ' bad' : '')} role="status">{note.text}</p>}

      <h3>登入與同步</h3>
      <AccountPanel />

      <h3>裝到手機上</h3>
      {standalone ? <p>你現在就是從主畫面的圖示開的。</p>
        : pwa.canInstall ? <><p>裝了之後，主畫面會多一個圖示，打開就是全螢幕。</p><button type="button" className="pick" onClick={async () => { sfx.tap(); if (await install()) say('裝好了。'); }}>安裝到主畫面</button></>
        : isIos() ? <p>iPhone 和 iPad：用 Safari 打開這一頁，按下面的「分享」，再選「加入主畫面」。</p>
        : <p>Android：在 Chrome 的選單裡選「安裝應用程式」或「加到主畫面」。電腦：網址列右邊如果有安裝的圖示，按它就可以。</p>}
      <p className="dim">{pwa.offline ? '這台裝置已經存好一份，沒有網路也可以玩。' : pwa.supported ? '第一次打開要有網路；存好之後，沒有網路也可以玩。' : '這個地方不能離線使用，要有網路才能開。'}</p>
      {isIos() && !standalone && <p className="dim">iPhone 和 iPad 要注意兩件事：Safari 隔太久沒有打開這一頁，可能會把進度清掉，加到主畫面比較保險；主畫面的圖示和 Safari 的進度是分開存的，裝好之後進度如果是空的，回 Safari 匯出一份、再到圖示裡匯入。</p>}

      <h3>版本</h3>
      <p>這一版：{__BUILD__}</p>
      {pwa.update ? <button type="button" className="pick on" onClick={() => { sfx.done(); applyUpdate(); }}>新版準備好了，現在換上</button>
        : pwa.supported && <button type="button" className="pick" disabled={checking} onClick={check}>{checking ? '檢查中……' : '檢查有沒有新版'}</button>}
      <p className="dim">更新不會動到進度。病例都還是草稿，還沒有經過臨床老師審查。</p>

      <h3>使用統計</h3>
      {!statsBuilt ? <p className="dim">這一版不會回傳任何資料。</p> : <>
        <p>{consent === 'yes' ? '現在：會回傳匿名的使用統計。' : '現在：不回傳。'}</p>
        <StatsFacts />
        {consent === 'yes' ? <button type="button" className="pick" onClick={() => { sfx.tap(); setConsent('no'); }}>改成不要回傳</button>
          : <button type="button" className="pick" onClick={() => { sfx.tap(); setConsent('yes'); }}>改成可以回傳</button>}
      </>}

      <h3>其他</h3>
      <div className="stack">
        {acct.backend && <button type="button" className="pick" onClick={() => { sfx.page(); setReport(true); }}>回報問題或建議</button>}
        <button type="button" className="pick" onClick={() => { sfx.page(); openPrivacy(); }}>隱私說明</button>
        {onReplayIntro && <button type="button" className="pick" onClick={() => { sfx.page(); onReplayIntro(); }}>重看開場</button>}
        {!sure ? <button type="button" className="pick" onClick={() => { sfx.tap(); setSure(true); }}>從頭來過（清除這台裝置上的進度）</button>
          : <><p className="note bad">確定要清除嗎？完成的委託、圖鑑、還沒結案的那一張都會不見，沒辦法復原。{acct.account ? '你現在有登入：雲端那一份還在，下一次同步會把它帶回來。要真的從頭來過，先到上面「刪除雲端的資料和帳號」，再回來清除。' : ''}</p>
            <button type="button" className="pick" onClick={() => { sfx.miss(); onReset(); onClose(); }}>確定清除</button>
            <button type="button" className="pick on" onClick={() => setSure(false)}>不要，留著</button></>}
      </div>
    </Sheet>
  );
}

/** 回傳什麼、不回傳什麼。第一次問的時候和設定頁用同一份，才不會兩邊講的不一樣 */
export function StatsFacts() {
  return (
    <ul className="dim">
      <li>會回傳：哪一張委託開始了、做到哪一段、有沒有結案、分數、花了多久、問了岑禾幾次、用手機還是電腦、是哪一版。</li>
      <li>不會回傳：姓名、帳號、你選的句子、任何文字。就算你有登入，統計和帳號也是分開存的，連不起來。</li>
      <li>用一組隨機的代號分辨不同的裝置，沒辦法從它知道你是誰。選「不要」，代號和還沒送出去的都會清掉。</li>
      <li>用途是讓作者知道哪一關有人玩、哪裡容易卡住。選哪一個都不影響遊戲。</li>
    </ul>
  );
}
