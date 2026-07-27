'use client';

import { motion, type Variants } from 'framer-motion';

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.21, 0.5, 0.3, 1] },
  }),
};

/** Fade + slide up on scroll into view. `index` staggers grouped items. */
export function Reveal({
  children,
  index = 0,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
}) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      custom={index}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </MotionTag>
  );
}
