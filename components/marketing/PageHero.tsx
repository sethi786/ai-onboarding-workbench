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
      <div className="bg-grid radial-fade absolute inset-0 opacity-[0.15]" />
      <div className="pointer-events-none absolute left-1/2 top-[-20%] h-72 w-[700px] -translate-x-1/2 rounded-full bg-electric/15 blur-[110px]" />
      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-electric-soft">
          {eyebrow}
        </span>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[56px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
