const NAMES = [
  'ChatGPT Enterprise',
  'Microsoft 365 Copilot',
  'Salesforce',
  'Snowflake',
  'AWS Bedrock',
  'Slack',
  'ServiceNow',
  'Workday',
  'Claude Enterprise',
  'Datadog',
  'Databricks',
  'GitHub Copilot',
  'Azure OpenAI',
  'Notion',
];

export function LogoMarquee() {
  const row = [...NAMES, ...NAMES];
  return (
    <section className="bg-paper py-12">
      <p className="mb-8 text-center text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
        Governs every tool your teams want to adopt
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
