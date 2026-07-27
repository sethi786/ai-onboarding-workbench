import { SCORE_LABELS } from '../../data/constants';

interface Props {
  value: number; // -1 = unset, 0..5
  onChange: (v: number) => void;
}

export function ScoreSelect({ value, onChange }: Props) {
  return (
    <div className="row" style={{ gap: 10 }}>
      <div className="score" role="radiogroup" aria-label="Self-assessment score">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`score__opt ${value === n ? 'score__opt--active' : ''}`}
            onClick={() => onChange(n)}
            title={SCORE_LABELS[n]}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="subtle" style={{ fontSize: 12 }}>
        {value < 0 ? 'Not scored' : SCORE_LABELS[value]}
      </span>
    </div>
  );
}
