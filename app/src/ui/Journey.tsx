// 你在哪裡：五章加終章的一條進度。首頁和大廳最上面都放這一條。
import { journey } from './progress.ts';
import type { Save } from './store.ts';

export function Journey({ save, compact }: { save: Save; compact?: boolean }) {
  const j = journey(save), all = j.legs.every((l) => l.state === 'done');
  return (
    <div className={'journey' + (compact ? ' compact' : '')}>
      <ol aria-label="五章和終章的進度">
        {j.legs.map((l) => (
          <li key={l.key} className={l.state} aria-label={l.name + (l.state === 'later' ? '，還沒開始' : '，' + l.done + '／' + l.total)} aria-current={l.state === 'now' ? 'step' : undefined}>
            <span>{l.short}</span><i><b style={{ width: (100 * l.done) / l.total + '%' }} /></i>
          </li>
        ))}
      </ol>
      <p>{all ? '五章和終章都走完了。全部 ' + j.done + '／' + j.total + ' 張委託。' : <>你在<b>{j.now.name}・{j.now.place}</b>：這一章 {j.now.done}／{j.now.total}{j.now.key === 'end' ? ' 段' : ' 張'}，全部 {j.done}／{j.total} 張。</>}</p>
    </div>
  );
}
