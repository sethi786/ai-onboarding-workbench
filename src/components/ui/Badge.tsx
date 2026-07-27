import type { BadgeTone } from './statusColors';

interface Props {
  tone: BadgeTone;
  children: React.ReactNode;
  dot?: boolean;
}

export function Badge({ tone, children, dot = true }: Props) {
  return (
    <span className={`badge badge--${tone}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}
