// 航海日誌：一天一頁，自動寫好你那天做了什麼；底下可以自己補一句。規則在 diary.ts。
import { useState } from 'react';
import { NOTE_MAX, diaryOf } from './diary.ts';
import type { Save } from './store.ts';
import { sfx } from './sound.ts';

const PAGE = 14;

export function DiaryBody({ save, onNote }: { save: Save; onNote(day: string, text: string): void }) {
  const pages = diaryOf(save), [shown, setShown] = useState(PAGE);
  const [editing, setEditing] = useState<string | null>(null), [draft, setDraft] = useState('');
  const open = (day: string, text: string) => { sfx.tap(); setEditing(day); setDraft(text); };
  const keep = (day: string, had: string) => { if (draft.trim() || had) { sfx.done(); onNote(day, draft); } setEditing(null); };
  return (
    <>
      <p className="dim">費民照你每天做了什麼，一天寫一頁。底下可以自己補一句：今天卡在哪裡、想通了什麼、下次要記得的事。寫的話跟著進度存；有登入就同步到其他裝置。</p>
      {pages.slice(0, shown).map((p) => (
        <article key={p.day} className="paper diary-page" aria-label={p.title}>
          <h3>{p.title}</h3>
          <ul>{p.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
          {editing === p.day ? (
            <div className="diary-edit">
              <label htmlFor={'note-' + p.day}>你自己的一句</label>
              <textarea id={'note-' + p.day} value={draft} maxLength={NOTE_MAX} rows={3} onChange={(e) => setDraft(e.target.value)} placeholder="例如：今天問診太快下結論，下次先把要排除的方向寫下來。" />
              <span className="dim">{[...draft].length}／{NOTE_MAX}</span>
              <div className="two">
                <button type="button" className="act" onClick={() => { sfx.tap(); setEditing(null); }}>取消</button>
                <button type="button" className="act demo" onClick={() => keep(p.day, p.note)}>{draft.trim() ? '存下' : (p.note ? '刪掉這一句' : '存下')}</button>
              </div>
            </div>
          ) : p.note ? (
            <div className="diary-note"><p>「{p.note}」</p><button type="button" className="pick" onClick={() => open(p.day, p.note)}>改這一句</button></div>
          ) : (
            <button type="button" className="pick" onClick={() => open(p.day, '')}>寫一句</button>
          )}
        </article>
      ))}
      {pages.length > shown && <button type="button" className="pick" onClick={() => { sfx.page(); setShown(shown + PAGE); }}>再往前看 {Math.min(PAGE, pages.length - shown)} 天</button>}
      <p className="dim">自動寫的部分只算最近 300 場；自己寫的話留最近 400 天。這是給你自己看的，不計分，也不會傳給研究或管理者。</p>
    </>
  );
}
