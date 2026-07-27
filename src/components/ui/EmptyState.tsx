interface Props {
  icon?: string;
  title: string;
  hint?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon = '📋', title, hint, children }: Props) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <h3>{title}</h3>
      {hint && <p className="muted">{hint}</p>}
      {children}
    </div>
  );
}
