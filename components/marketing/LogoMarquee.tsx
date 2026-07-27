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
    <section className="bg-paper py-12">
      <p className="mb-8 text-center text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
        Governs the AI tools your teams already want
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="marquee-track gap-14 whitespace-nowrap">
          {row.map((n, i) => (
            <span key={i} className="text-[15px] font-medium text-foreground/45">
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
