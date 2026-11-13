// 隱私說明的那一頁：網址後面加 #privacy。內容在 privacy.ts。
import { useEffect } from 'react';
import { PRIVACY, PRIVACY_UPDATED } from './privacy.ts';

export function PrivacyPage({ onClose }: { onClose(): void }) {
  useEffect(() => { document.documentElement.classList.add('admin'); return () => document.documentElement.classList.remove('admin'); }, []);
  return (
    <div className="admin-page prose">
      <div className="admin-top"><h1>霧脈公會｜隱私說明</h1><button type="button" className="pick" onClick={onClose}>回到遊戲</button></div>
      <p className="dim">最後更新：{PRIVACY_UPDATED}</p>
      {PRIVACY.map((s) => (
        <section key={s.title}>
          <h2>{s.title}</h2>
          {s.lines.map((l) => <p key={l}>{l}</p>)}
          {s.list && <ul>{s.list.map((l) => <li key={l}>{l}</li>)}</ul>}
        </section>
      ))}
    </div>
  );
}
/** 打開隱私說明（換網址後面那一段，App 會接手） */
export const openPrivacy = () => { location.hash = '#privacy'; };
