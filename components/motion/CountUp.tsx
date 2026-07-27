'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, animate } from 'framer-motion';

/** Spring-counts from 0 → value when scrolled into view. */
export function CountUp({
  value,
  suffix = '',
  prefix = '',
  duration = 1.4,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, {
      duration,
      ease: [0.21, 0.5, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration, mv]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
