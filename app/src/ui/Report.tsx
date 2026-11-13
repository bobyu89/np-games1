// 回報問題：哪裡寫錯了、哪裡卡住、有什麼建議。匿名送到後端，作者在管理頁看得到。
// 除了玩家自己寫的那一段字，只會帶：哪一種問題、在哪個畫面、哪一張委託、遊戲是哪一版、手機還是電腦。
import { useState, useSyncExternalStore } from 'react';
import { Sheet } from './Sheets.tsx';
import { sfx } from './sound.ts';
import { accountState, accountSubscribe } from './account.ts';
import { isIos } from './pwa.ts';

export type ReportPlace = 'title' | 'hall' | 'ward' | 'debrief' | 'settings';
const KINDS = [['content', '內容有錯', '病例、答案、說明或用詞有問題'], ['stuck', '操作卡住', '按了沒反應、畫面壞掉、不知道下一步'], ['idea', '建議', '想要什麼、哪裡可以更好'], ['other', '其他', '']] as const;
const LIMIT = 1000;
const platform = () => (isIos() ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : /windows|macintosh|linux|cros/i.test(navigator.userAgent) ? 'desktop' : 'other');

/** 這個地方有沒有後端可以收回報。沒有的話，回報的按鈕不要出現 */
export function useCanReport() { return useSyncExternalStore(accountSubscribe, () => accountState().backend); }

export function ReportSheet({ place, caseId, caseTitle, onClose }: { place: ReportPlace; caseId?: string; caseTitle?: string; onClose(): void }) {
  const [kind, setKind] = useState<string>(caseId ? 'content' : 'stuck');
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | { bad: string }>('idle');
  const send = async () => {
    setState('busy');
    try {
      const res = await fetch(new URL('api/report', document.baseURI).href, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, credentials: 'omit', referrerPolicy: 'same-origin',
        body: JSON.stringify({ v: 1, kind, text: text.trim(), place, c: caseId, b: __BUILD__, pf: platform() }) });
      if (res.ok) { sfx.done(); setState('sent'); return; }
      setState({ bad: res.status === 429 ? '今天收到的回報太多了，請明天再試。' : '沒有送成功（' + res.status + '）。請再試一次。' });
    } catch { setState({ bad: '沒有送成功，可能是沒有網路。你寫的字還在，連上網路之後再按一次。' }); }
  };
  if (state === 'sent') {
    return (
      <Sheet title="回報問題" onClose={onClose} footer={<button type="button" className="act demo" onClick={onClose}>好</button>}>
        <p>收到了，謝謝你。</p>
        <p className="dim">回報是匿名的，所以沒有辦法個別回覆；修好的東西會跟著下一次更新出現。</p>
      </Sheet>
    );
  }
  const n = text.trim().length;
  return (
    <Sheet title="回報問題" onClose={onClose} footer={<button type="button" className="act demo" disabled={n < 2 || n > LIMIT || state === 'busy'} onClick={send}>{state === 'busy' ? '送出中……' : '送出'}</button>}>
      {caseTitle && <p>關於：<b>{caseTitle}</b></p>}
      <h3>是哪一種？</h3>
      <div className="stack">{KINDS.map(([id, name, hint]) => <button key={id} type="button" className={'pick' + (kind === id ? ' on' : '')} aria-pressed={kind === id} onClick={() => { sfx.tap(); setKind(id); }}>{name}{hint && <small className="dim">　{hint}</small>}</button>)}</div>
      <h3>發生了什麼事？</h3>
      <textarea className="code say" value={text} rows={5} maxLength={LIMIT + 200} aria-label="發生了什麼事" placeholder={kind === 'content' ? '例如：哪一題、哪一句，你覺得應該是什麼' : '寫下你看到的，越具體越好'} onChange={(e) => { setText(e.target.value); if (typeof state === 'object') setState('idle'); }} />
      <p className="dim">{n > LIMIT ? '太長了，請刪到 ' + LIMIT + ' 個字以內。' : n + '／' + LIMIT + ' 個字'}</p>
      {typeof state === 'object' && <p className="note bad" role="status">{state.bad}</p>}
      <p className="dim">會一起送出的只有：{caseId ? '是哪一張委託、' : ''}你在哪個畫面、遊戲是哪一版、用手機還是電腦。<b>不會送出你的名字、帳號或進度</b>，所以請不要在裡面寫自己或別人的個人資料。</p>
    </Sheet>
  );
}
