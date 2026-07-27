import { progressClass } from './statusColors';

interface Props {
  value: number; // 0..100
  showLabel?: boolean;
  tone?: 'auto' | 'blue';
}

export function ProgressBar({ value, showLabel, tone = 'auto' }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const cls = tone === 'blue' ? '' : progressClass(clamped);
  return (
    <div className="row" style={{ gap: 8 }}>
      <div className="progress" style={{ flex: 1 }}>
        <div className={`progress__bar ${cls}`} style={{ width: `${clamped}%` }} />
      </div>
      {showLabel && <span className="mono" style={{ minWidth: 34, textAlign: 'right' }}>{clamped}%</span>}
    </div>
  );
}
