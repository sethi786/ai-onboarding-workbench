export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-deep text-white">
      <div className="bg-grid radial-fade absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-electric-soft">
          {eyebrow}
        </span>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight lg:text-5xl">{title}</h1>
        {subtitle && <p className="mt-5 max-w-2xl text-lg text-slate-300">{subtitle}</p>}
      </div>
    </section>
  );
}
