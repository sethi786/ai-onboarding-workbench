/**
 * Page masthead.
 *
 * The eyebrow is set as quiet running text under a hairline rather than the
 * small-caps-in-accent-colour treatment it used to carry. That treatment was on
 * every section of every page, and a device repeated twenty times stops being a
 * device and becomes a template — which is precisely what the site was being
 * mistaken for.
 */
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
        <span className="inline-block border-b border-foreground/20 pb-2 text-[13px] text-muted-foreground">
          {eyebrow}
        </span>
        <h1 className="display-lg mx-auto mt-7 max-w-3xl">{title}</h1>
        {subtitle && (
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
