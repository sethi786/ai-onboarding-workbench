import { useState } from 'react';

interface Props {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Accordion({ title, count, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="acc">
      <button type="button" className="acc__head" onClick={() => setOpen((o) => !o)}>
        <span className={`acc__chevron ${open ? 'acc__chevron--open' : ''}`}>▶</span>
        {title}
        {count !== undefined && <span className="acc__count">{count}</span>}
      </button>
      {open && <div className="acc__body">{children}</div>}
    </div>
  );
}
