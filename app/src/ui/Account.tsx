// 登入和同步的那一塊：放在「設定」裡，首頁也可以直接打開。
import { useState, useSyncExternalStore } from 'react';
import { sfx } from './sound.ts';
import { PROVIDER_NAME, accountState, accountSubscribe, clearFlash, deleteAccount, inLine, inOtherApp, signInWith, signOut, syncNow } from './account.ts';

const when = (ms: number) => new Date(ms).toLocaleString('zh-TW', { hour12: false, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** 存什麼、不存什麼。登入之前和登入之後都看得到 */
export function AccountFacts() {
  return (
    <ul className="dim">
      <li>會存：你的進度（完成了哪些委託、分數、圖鑑寫回了哪些線索、選了哪一位主角）。和「匯出進度」是同一份。</li>
      <li>不會存：姓名、電子郵件、頭像。登入的時候只向 Google 或 LINE 要一組「這是同一個人」的代號，存的還是打亂過的版本。</li>
      <li>做到一半的那一張委託不會同步，只留在這一台。</li>
      <li>Google 和 LINE 是兩個各自的帳號，進度不互通。選一個，固定用它。</li>
      <li>隨時可以登出，或是把雲端的資料連同帳號一起刪掉；裝置上的進度不受影響。</li>
    </ul>
  );
}

export function AccountPanel() {
  const a = useSyncExternalStore(accountSubscribe, accountState);
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState(false);
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const flash = note ?? a.flash;

  if (!a.ready) return <p className="dim">正在確認……</p>;
  if (!a.providers.length && !a.account) return <p className="dim">{navigator.onLine === false ? '現在沒有網路，沒辦法登入。進度照常存在這台裝置上。' : '這個地方沒有開放登入。進度存在這台裝置上；要換裝置，用下面的「匯出進度」。'}</p>;

  if (!a.account) {
    const line = inLine(), other = inOtherApp(), list = a.providers.filter((p) => !(line && p === 'google'));
    return <>
      <p>登入之後，進度會在雲端多存一份：換手機、換瀏覽器、清掉瀏覽器資料，登入就接得上。<b>不登入也可以玩</b>，進度照常存在這台裝置上。</p>
      {flash && <p className={'note' + (flash.bad ? ' bad' : '')} role="status">{flash.text}</p>}
      <div className="stack">
        {list.map((p) => <button key={p} type="button" className={'pick login ' + p} onClick={() => { sfx.tap(); clearFlash(); signInWith(p); }}>用 {PROVIDER_NAME[p]} 登入</button>)}
      </div>
      {line && a.providers.includes('google') && <p className="dim">你現在是在 LINE 裡面開的，這裡只能用 LINE 登入。要用 Google 登入，請改用 Safari 或 Chrome 開這個網址。</p>}
      {line && !list.length && <p className="note bad">你現在是在 LINE 裡面開的，Google 不允許在這裡登入。請改用 Safari 或 Chrome 開這個網址。</p>}
      {other && <p className="dim">你現在可能是在別的 App 裡面開的，Google 登入多半會被擋。登入不了的話，請改用 Safari 或 Chrome 開這個網址。</p>}
      <AccountFacts />
    </>;
  }

  const status = a.sync === 'busy' ? '同步中……'
    : a.sync === 'fail' ? '剛才那一次同步沒有成功（可能是網路）。進度還在這台裝置上，等一下會再試。'
    : a.sync === 'old' ? '雲端那一份是比較新的遊戲存的。這一台先只下載、不上傳；請到下面的「版本」更新遊戲。'
    : a.syncedAt ? '上次同步：' + when(a.syncedAt) + '。' : '還沒有同步過。';
  return <>
    <p>現在：用 <b>{PROVIDER_NAME[a.account.provider]}</b> 登入。進度會自動同步：打開遊戲、結案之後各一次。</p>
    {flash && <p className={'note' + (flash.bad ? ' bad' : '')} role="status">{flash.text}</p>}
    <p className={a.sync === 'fail' || a.sync === 'old' ? 'note bad' : 'dim'} role="status">{status}</p>
    <div className="stack">
      <button type="button" className="pick" disabled={a.sync === 'busy'} onClick={() => { sfx.tap(); setNote(null); clearFlash(); void syncNow(); }}>現在同步</button>
      <button type="button" className="pick" disabled={busy} onClick={async () => { sfx.tap(); setBusy(true); const ok = await signOut(); setBusy(false); clearFlash(); setNote(ok ? { text: '登出了。這台裝置上的進度還在。' } : { text: '登出沒有成功，可能是沒有網路。', bad: true }); }}>登出這一台</button>
      {!sure ? <button type="button" className="pick" onClick={() => { sfx.tap(); setSure(true); }}>刪除雲端的資料和帳號</button>
        : <><p className="note bad">確定要刪除嗎？雲端那一份進度和這個帳號會刪掉，其他裝置也會被登出。這台裝置上的進度不會動。</p>
          <button type="button" className="pick" disabled={busy} onClick={async () => { sfx.miss(); setBusy(true); const ok = await deleteAccount(); setBusy(false); setSure(false); clearFlash(); setNote(ok ? { text: '刪掉了。這台裝置上的進度還在。' } : { text: '沒有刪成功，可能是沒有網路。請再試一次。', bad: true }); }}>確定刪除</button>
          <button type="button" className="pick on" onClick={() => setSure(false)}>不要，留著</button></>}
    </div>
    <AccountFacts />
  </>;
}
