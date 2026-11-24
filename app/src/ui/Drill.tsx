// 刻意練習的那一張紙：選一種練習 → 一題一題做，每題馬上看回饋 → 最後看這一輪對了幾題。規則在 drill.ts。
import { useState } from 'react';
import type { Tell } from '../core/types.ts';
import { DRILLS, buildDrill, drillCases, factsOf, readOk, stemOf, type DrillItem, type DrillKind } from './drill.ts';
import { Sheet } from './Sheets.tsx';
import type { Save } from './store.ts';
import { sfx } from './sound.ts';

type Answer = { ok: boolean; pick: string };

export function DrillSheet({ save, onClose }: { save: Save; onClose(): void }) {
  const [kind, setKind] = useState<DrillKind | null>(null);
  const [items, setItems] = useState<DrillItem[]>([]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const start = (k: DrillKind) => { sfx.page(); setKind(k); setItems(buildDrill(k, save, Date.now())); setI(0); setAnswers([]); };
  const pool = drillCases(save).length;
  const done = kind !== null && answers.length === items.length && items.length > 0;
  const item = items[i], answered = answers[i];
  const answer = (a: Answer) => { if (answered) return; if (a.ok) sfx.done(); else sfx.miss(); setAnswers([...answers, a]); };

  if (!kind) return (
    <Sheet title="刻意練習" onClose={onClose}>
      <p>一次只練一個環節。題目短，每一題馬上告訴你對不對、為什麼；練幾輪都可以。</p>
      <p className="dim">題目只從你看過的病人出（結過案的委託、考過的試弓），現在有 {pool} 位。不計分、不寫圖鑑、不算打卡。</p>
      <div className="stack">{DRILLS.map((d) => <button key={d.kind} type="button" className="pick" disabled={!pool} onClick={() => start(d.kind)}><b>{d.name}</b>（{d.n} 題）<br /><span className="dim">{d.what}</span></button>)}</div>
      {!pool && <p className="dim">先結案一張委託，這裡就有題目了。</p>}
    </Sheet>
  );

  const name = DRILLS.find((d) => d.kind === kind)!.name;
  if (done) {
    const ok = answers.filter((a) => a.ok).length;
    return (
      <Sheet title={'刻意練習：' + name} onClose={onClose} footer={<div className="two"><button type="button" className="act" onClick={() => { sfx.page(); setKind(null); }}>換一種</button><button type="button" className="act demo" onClick={() => start(kind)}>再一輪</button></div>}>
        <p className={'note' + (ok === items.length ? '' : ' bad')}><b>這一輪對了 {ok}／{items.length} 題。</b>{ok === items.length ? '全對。換一種練，或再一輪換一組題目。' : '錯的那幾題，回去看孟拓說的理由，再一輪會換題目。'}</p>
        <ul className="path">{items.map((it, k) => <li key={k} className={answers[k].ok ? 'up' : 'down'}>{answers[k].ok ? '○' : '×'} {it.c.patient.name}（{it.c.complaintName}）：{it.kind === 'read' ? it.clue.text : it.options.find((o) => o.id === answers[k].pick)?.text}</li>)}</ul>
      </Sheet>
    );
  }

  const next = <button type="button" className="act demo" disabled={!answered} onClick={() => { sfx.page(); setI(i + 1); }}>{i + 1 < items.length ? '下一題' : '看這一輪'}</button>;
  return (
    <Sheet title={'刻意練習：' + name + '（' + (i + 1) + '／' + items.length + '）'} onClose={onClose} footer={answered ? next : undefined}>
      <p className="dim">{stemOf(item.c)}</p>
      {item.kind === 'read' ? <ReadQ item={item} answered={answered} onAnswer={answer} /> : <PickQ item={item} answered={answered} onAnswer={answer} />}
    </Sheet>
  );
}

function ReadQ({ item, answered, onAnswer }: { item: Extract<DrillItem, { kind: 'read' }>; answered?: Answer; onAnswer(a: Answer): void }) {
  const { c, clue } = item, key = (t: Tell) => t.form + (t.dir > 0 ? '+' : '-');
  const right = clue.tell!, form = c.forms.find((f) => f.id === right.form)!;
  return (
    <>
      <p className="quote">{clue.text}</p>
      <p>這條線索讓哪一個診斷<b>更像</b>，或是<b>比較不像</b>？</p>
      <div className="hyps">
        {c.forms.map((f) => (
          <div key={f.id} className="hyp">
            <span><i className="mark" aria-hidden="true">{f.mark}</i>{f.name}</span>
            {([1, -1] as const).map((dir) => {
              const t = { form: f.id, dir }, k = key(t), isRight = answered && readOk(clue, t), isPick = answered?.pick === k;
              return <button key={dir} type="button" className={'pick' + (isPick ? ' on' : '') + (isRight ? ' correct' : isPick ? ' miss' : '')} aria-pressed={isPick} disabled={!!answered} onClick={() => { sfx.tap(); onAnswer({ ok: readOk(clue, t), pick: k }); }}>{dir > 0 ? '更像' : '比較不像'}</button>;
            })}
          </div>
        ))}
      </div>
      {answered && <>
        <p className={answered.ok ? 'up' : 'down'}><b>{answered.ok ? '對。' : answered.pick.slice(0, -1) === right.form ? '診斷選對了，方向反了。' : '不是這一個。'}</b>這條線索讓「{form.name}」{right.dir > 0 ? '更像' : '比較不像'}。</p>
        {clue.why && <p><b className="name">孟拓</b>「{clue.why}」</p>}
        {item.fresh && <p className="dim">這一條你在病室裡還沒解讀對過。</p>}
      </>}
    </>
  );
}

function PickQ({ item, answered, onAnswer }: { item: Extract<DrillItem, { kind: 'summary' | 'sbar' }>; answered?: Answer; onAnswer(a: Answer): void }) {
  const f = factsOf(item.c), truth = item.c.forms.find((k) => k.id === item.c.answer.truth)!;
  const picked = item.options.find((o) => o.id === answered?.pick);
  return (
    <>
      <h3>重點線索</h3>
      <ul>{f.pos.map((t) => <li key={t}>{t}</li>)}{f.neg.map((t) => <li key={t} className="dim">沒有：{t}</li>)}<li>{f.vitals}</li></ul>
      {item.kind === 'sbar' && <p>你的診斷方向：<b>{truth.name}</b>（{truth.blurb}）</p>}
      <p>{item.kind === 'summary' ? '用一句話說出問題，哪一句最好？' : '向值班醫師回報，「你認為是什麼狀況」這一句怎麼說最好？'}</p>
      <div className="stack">{item.options.map((o) => {
        const isPick = answered?.pick === o.id, isBest = answered && item.best.includes(o.id);
        return <button key={o.id} type="button" className={'pick' + (isPick ? ' on' : '') + (isBest ? ' correct' : isPick ? ' miss' : '')} aria-pressed={isPick} disabled={!!answered} onClick={() => { sfx.tap(); onAnswer({ ok: item.best.includes(o.id), pick: o.id }); }}>{o.text}</button>;
      })}</div>
      {answered && picked && <>
        <p className={answered.ok ? 'up' : 'down'}><b>{answered.ok ? '對，這一句最好。' : picked.score > 0 ? '可以，但不是最好的。' : '這一句不適合。'}</b>{picked.note}</p>
        {!answered.ok && item.options.filter((o) => item.best.includes(o.id)).map((o) => <p key={o.id} className="quote">最好的是：{o.text}<br /><span className="dim">{o.note}</span></p>)}
      </>}
    </>
  );
}
