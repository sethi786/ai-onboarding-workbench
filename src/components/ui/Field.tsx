interface Props {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, children }: Props) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}
