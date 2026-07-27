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
    <section className="border-b border-border bg-paper">
      <div className="mx-auto max-w-4xl px-5 pb-16 pt-20 text-center sm:px-8 sm:pb-20 sm:pt-28">
        <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-electric">
          {eyebrow}
        </span>
        <h1 className="display-lg mx-auto mt-4 max-w-3xl">{title}</h1>
        {subtitle && (
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
