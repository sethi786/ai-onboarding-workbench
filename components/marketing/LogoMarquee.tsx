const NAMES = [
  'ChatGPT Enterprise',
  'Microsoft 365 Copilot',
  'Claude Enterprise',
  'Gemini Enterprise',
  'Azure AI Foundry',
  'AWS Bedrock',
  'Vertex AI',
  'Copilot Studio',
  'GitHub Copilot',
  'Glean',
  'Perplexity',
  'Cursor',
];

export function LogoMarquee() {
  const row = [...NAMES, ...NAMES];
  return (
    <section className="border-y border-border bg-muted/30 py-8">
      <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Onboard the AI tools your teams already want
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        <div className="marquee-track gap-10 whitespace-nowrap">
          {row.map((n, i) => (
            <span key={i} className="text-sm font-semibold text-muted-foreground/80">
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
