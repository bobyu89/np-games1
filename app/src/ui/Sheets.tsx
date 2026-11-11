// 蓋在畫面上的紙：推理板、回報、說明、線索、確認。
// 看字和排推理板不扣時間，所以這些都可以慢慢想。
import { useState, type ReactNode } from 'react';
import type { Board, CaseDef, Clue, Session } from '../core/types.ts';
import { sfx } from './sound.ts';

export function Sheet({ title, onClose, children, footer }: { title: string; onClose(): void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet-top">
        <h2>{title}</h2>
        <button type="button" className="x" onClick={onClose} aria-label="關閉">✕</button>
      </div>
      <div className="sheet-body">{children}</div>
      {footer && <div className="sheet-foot">{footer}</div>}
    </div>
  );
}

const clueOf = (c: CaseDef, id: string) => c.clues.find((k) => k.id === id)!;
const toggle = (list: string[], id: string, max = 99) => (list.includes(id) ? list.filter((k) => k !== id) : list.length >= max ? list : [...list, id]);
const KIND: Record<Clue['kind'], string> = { pos: '有的', neg: '沒有的', info: '背景' };

function Pick({ on, onClick, children, tone = '' }: { on: boolean; onClick(): void; children: ReactNode; tone?: string }) {
  return <button type="button" className={'pick ' + tone + (on ? ' on' : '')} aria-pressed={on} onClick={() => { sfx.tap(); onClick(); }}>{children}</button>;
}

/** 推理板：一句問題摘要 → 最可能的、還要排除的 → 支持和反對的線索 */
export function BoardSheet({ c, s, onSave, onClose }: { c: CaseDef; s: Session; onSave(b: Board): void; onClose(): void }) {
  const [b, setB] = useState<Board>(s.board);
  const likely = c.hypotheses.find((h) => h.id === b.likely), ex = c.hypotheses.find((h) => h.id === b.exclude[0]);
  const mine = s.clues.map((id) => clueOf(c, id));
  const unasked = c.questions.filter((q) => q.weight > 0 && !s.asked.includes(q.id)).map((q) => q.label);
  const chips = (list: string[], set: (v: string[]) => void, max: number) => (
    mine.length ? <div className="chips wrap">{mine.map((k) => <Pick key={k.id} tone={k.kind} on={list.includes(k.id)} onClick={() => set(toggle(list, k.id, max))}>{k.text}</Pick>)}</div> : <p className="dim">還沒有線索。先去問診或評估。</p>
  );
  return (
    <Sheet title="推理板" onClose={onClose} footer={<button type="button" className="act demo" onClick={() => onSave(b)}>記下來</button>}>
      <h3>一、用一句話說出問題</h3>
      <div className="stack">{c.summaries.map((k) => <Pick key={k.id} on={b.summary === k.id} onClick={() => setB({ ...b, summary: k.id })}>{k.text}</Pick>)}</div>

      <h3>二、最可能的是什麼？還要排除什麼？</h3>
      <p className="dim">最可能的選一個；還要排除的最多三個。</p>
      <div className="hyps">
        {c.hypotheses.map((h) => (
          <div key={h.id} className="hyp">
            <span>{h.name}</span>
            <Pick tone="likely" on={b.likely === h.id} onClick={() => setB({ ...b, likely: b.likely === h.id ? null : h.id, exclude: b.exclude.filter((k) => k !== h.id), support: [] })}>最可能</Pick>
            <Pick tone="exclude" on={b.exclude.includes(h.id)} onClick={() => setB({ ...b, exclude: toggle(b.exclude, h.id, 3), likely: b.likely === h.id ? null : b.likely, against: [] })}>要排除</Pick>
          </div>
        ))}
      </div>

      <h3>三、證據</h3>
      {likely ? <><p>哪些線索<b>支持</b>「{likely.name}」？（最多五條）</p>{chips(b.support, (v) => setB({ ...b, support: v }), 5)}</> : <p className="dim">先選一個最可能的問題。</p>}
      {ex ? <><p>哪些線索讓「{ex.name}」<b>比較不像</b>？（最多四條）</p>{chips(b.against, (v) => setB({ ...b, against: v }), 4)}</> : <p className="dim">先選一個還要排除的問題。</p>}

      <h3>還不知道的</h3>
      <p className="dim">{unasked.length ? '還沒問：' + unasked.join('、') + '。' : '病史都問過了。'}{s.vitalsSeen ? '' : ' 生命徵象還沒量。'}</p>
    </Sheet>
  );
}

/** 回報：現況和背景由你手上的線索自動組成，評估和請求由你決定 */
export function ReportSheet({ c, s, onSend, onClose }: { c: CaseDef; s: Session; onSend(a: string, r: string[]): void; onClose(): void }) {
  const [a, setA] = useState<string | null>(null), [r, setR] = useState<string[]>([]);
  const mine = s.clues.map((id) => clueOf(c, id));
  const now = mine.filter((k) => k.kind === 'pos' && k.key && k.id !== 'c-vitals').slice(0, 4).map((k) => k.text), bg = mine.filter((k) => k.kind === 'info').slice(0, 4).map((k) => k.text);
  const v = s.vitalsSeen?.v;
  return (
    <Sheet title="向值班醫師回報" onClose={onClose} footer={<button type="button" className="act urgent" disabled={!a} onClick={() => a && onSend(a, r)}>回報</button>}>
      <p className="dim">現況和背景是用你手上的線索組成的。沒問到的，回報裡就沒有。</p>
      <h3>現況</h3>
      <p className="quote">{c.patient.name}，{c.patient.age} 歲{c.patient.sex}性，{c.complaint}。{now.length ? now.join('；') + '。' : '細節還沒問。'}{v ? '血壓 ' + v.bp + '、心跳 ' + v.hr + '、呼吸 ' + v.rr + '、血氧 ' + v.spo2 + '%。' : '生命徵象還沒量。'}</p>
      <h3>背景</h3>
      <p className="quote">{bg.length ? bg.join('；') + '。' : '過去病史、用藥和過敏都還沒問。'}</p>
      <h3>評估：你認為是什麼狀況？</h3>
      <div className="stack">{c.sbar.assessments.map((k) => <Pick key={k.id} on={a === k.id} onClick={() => setA(k.id)}>{k.text}</Pick>)}</div>
      <h3>請求：你要對方做什麼？你自己會做什麼？（可以複選）</h3>
      <div className="stack">{c.sbar.requests.map((k) => <Pick key={k.id} on={r.includes(k.id)} onClick={() => setR(toggle(r, k.id))}>{k.text}</Pick>)}</div>
    </Sheet>
  );
}

/** 向病人說明：選要說的話。沒問過他擔心什麼，就不會有回應他的那一句 */
export function ExplainSheet({ c, s, onSend, onClose }: { c: CaseDef; s: Session; onSend(ids: string[]): void; onClose(): void }) {
  const [ids, setIds] = useState<string[]>([]);
  const opts = c.explain.filter((e) => !e.needsClue || s.clues.includes(e.needsClue));
  return (
    <Sheet title={'向' + c.patient.name + '說明'} onClose={onClose} footer={<button type="button" className="act demo" disabled={!ids.length} onClick={() => onSend(ids)}>跟他說</button>}>
      <p className="dim">選你要說的話，最多四句。要讓他知道評估的結果、接下來會怎樣、要注意什麼。</p>
      <div className="stack">{opts.map((e) => <Pick key={e.id} on={ids.includes(e.id)} onClick={() => setIds(toggle(ids, e.id, 4))}>{e.text}</Pick>)}</div>
    </Sheet>
  );
}

/** 已知線索 */
export function CluesSheet({ c, s, onClose }: { c: CaseDef; s: Session; onClose(): void }) {
  const mine = s.clues.map((id) => clueOf(c, id));
  const ready = c.tests.filter((t) => t.result && (t.kind === 'record' ? s.log.some((l) => l.type === 'record' && l.id === t.id) : s.results.includes(t.id)));
  return (
    <Sheet title={'已知線索（' + mine.length + '）'} onClose={onClose}>
      {!mine.length && <p className="dim">還沒有線索。</p>}
      {(['pos', 'neg', 'info'] as const).map((kind) => {
        const list = mine.filter((k) => k.kind === kind);
        return list.length ? <div key={kind}><h3>{KIND[kind]}</h3><div className="chips wrap">{list.map((k) => <span key={k.id} className={'chip ' + kind + (k.key ? ' key' : '')}>{k.key ? '★ ' : ''}{k.text}</span>)}</div></div> : null;
      })}
      {ready.length > 0 && <><h3>資料和檢查結果</h3>{ready.map((t) => <p key={t.id} className="quote"><b>{t.label}</b>：{t.result}</p>)}</>}
    </Sheet>
  );
}

export function ConfirmSheet({ title, lines, yes, no, onYes, onNo }: { title: string; lines: string[]; yes: string; no: string; onYes(): void; onNo(): void }) {
  return (
    <Sheet title={title} onClose={onNo} footer={<div className="two"><button type="button" className="act" onClick={onNo}>{no}</button><button type="button" className="act urgent" onClick={onYes}>{yes}</button></div>}>
      {lines.map((l, i) => <p key={i}>{l}</p>)}
    </Sheet>
  );
}
