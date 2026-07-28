'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';

/**
 * Bands recalibrated for substantiation-weighted scoring.
 *
 * They were set when the engine let an unsubstantiated 5/5 self-score reach 50,
 * so scores ran high and the thresholds sat high with them. Now that evidence
 * sets the ceiling, a review that has genuinely done most of the work lands in
 * the sixties — and under the old bands that rendered in near-red, which told a
 * team doing everything right that they were failing. The recommendation badge
 * beside this carries the actual call; the ring is a magnitude.
 */
function bandColor(v: number) {
  if (v >= 80) return 'oklch(0.56 0.11 158)';
  if (v >= 60) return 'oklch(0.72 0.13 74)';
  if (v >= 35) return 'oklch(0.65 0.16 50)';
  return 'oklch(0.58 0.2 27)';
}

/** Animated circular readiness gauge (0–100). */
export function ScoreGauge({
  value,
  size = 160,
  stroke = 12,
  label = 'Readiness',
  onDark = false,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  onDark?: boolean;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const controls = animate(mv, v, {
      duration: 0.9,
      ease: [0.21, 0.5, 0.3, 1],
      onUpdate: (val) => {
        setDisplay(Math.round(val));
        setOffset(circ - (val / 100) * circ);
      },
    });
    return () => controls.stop();
  }, [v, circ, mv]);

  const track = onDark ? 'oklch(1 0 0 / 0.1)' : 'oklch(0.905 0.006 84)';

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={bandColor(v)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute grid place-items-center text-center">
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color: onDark ? '#fff' : 'var(--color-foreground)' }}
        >
          {display}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: onDark ? 'oklch(0.7 0.02 255)' : 'var(--color-muted-foreground)' }}>
          {label}
        </span>
      </div>
    </div>
  );
}
