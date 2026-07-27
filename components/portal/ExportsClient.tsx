'use client';

import { download } from '@/workbench/export/download';

interface Bundle {
  base: string;
  json: string;
  csv: string;
  markdown: string;
  gonogo: string;
  remediation: string;
}

export function ExportsClient({ bundle }: { bundle: Bundle }) {
  const actions: { label: string; file: string; mime: string; content: string }[] = [
    { label: 'Profile + assessments (JSON)', file: `${bundle.base}-profile.json`, mime: 'application/json', content: bundle.json },
    { label: 'Team status (CSV)', file: `${bundle.base}-status.csv`, mime: 'text/csv', content: bundle.csv },
    { label: 'Full readiness report (Markdown)', file: `${bundle.base}-report.md`, mime: 'text/markdown', content: bundle.markdown },
    { label: 'Go / No-Go decision pack', file: `${bundle.base}-go-no-go.md`, mime: 'text/markdown', content: bundle.gonogo },
    { label: 'Remediation plan', file: `${bundle.base}-remediation.md`, mime: 'text/markdown', content: bundle.remediation },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {actions.map((a) => (
        <button
          key={a.file}
          onClick={() => download(a.file, a.mime, a.content)}
          className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-left text-sm font-medium hover:border-electric/50"
        >
          ⬇ {a.label}
        </button>
      ))}
    </div>
  );
}
