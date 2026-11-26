// 考前速記頁：網址後面加 #notes。可以列印（每一種主訴盡量不跨頁）。內容在 notes.ts。
import { useEffect, useMemo } from 'react';
import { notes } from './notes.ts';

export function NotesPage({ onClose }: { onClose(): void }) {
  useEffect(() => { document.documentElement.classList.add('admin'); return () => document.documentElement.classList.remove('admin'); }, []);
  const list = useMemo(notes, []);
  return (
    <div className="admin-page prose notes-page">
      <div className="admin-top no-print"><h1>歸航記｜考前速記</h1><span><button type="button" className="pick" onClick={() => window.print()}>列印</button> <button type="button" className="pick" onClick={onClose}>回到遊戲</button></span></div>
      <h1 className="print-only">歸航記｜考前速記</h1>
      <p className="dim">十二種主訴，每一種：四個鑑別方向（★ 是不能漏的）、重點評估、下了診斷要先提出的檢查、最容易掉進去的陷阱，和遊戲裡每一位病人的教學重點。內容依文獻與臨床指引撰寫，僅供練習，不能取代臨床判斷。</p>
      <nav className="no-print notes-toc">{list.map((n) => <a key={n.complaint} href={'#notes-' + n.complaint} onClick={(e) => { e.preventDefault(); document.getElementById('notes-' + n.complaint)?.scrollIntoView({ behavior: 'smooth' }); }}>{n.name}</a>)}</nav>
      {list.map((n) => (
        <section key={n.complaint} id={'notes-' + n.complaint} className="note-sec">
          <h2>{n.name}<small>（{n.shadow}）</small></h2>
          <table className="note-forms"><tbody>{n.forms.map((f) => <tr key={f.id}><th>{f.danger ? '★ ' : ''}{f.name}</th><td>{f.blurb}</td></tr>)}</tbody></table>
          {n.exams.length > 0 && <p><b>重點評估：</b>{n.exams.join('、')}</p>}
          {n.orders.length > 0 && <p><b>下了診斷要先提出的檢查：</b>{n.orders.map((o) => o.label).join('、')}<span className="dim">（臨床上的時限照教學重點和指引，不是遊戲裡的計時）</span></p>}
          {n.peril && <p><b>陷阱：{n.peril.bias.name}</b>（{n.peril.bias.en}）。{n.peril.next}</p>}
          <ol className="note-points">{n.points.map((p) => <li key={p.text}>{p.text}<sup>［{p.ref + 1}］</sup></li>)}</ol>
          <ol className="note-refs">{n.refs.map((r) => <li key={r.id}>{r.text} <a href={'https://doi.org/' + r.doi} target="_blank" rel="noreferrer">doi:{r.doi}</a></li>)}</ol>
        </section>
      ))}
    </div>
  );
}
