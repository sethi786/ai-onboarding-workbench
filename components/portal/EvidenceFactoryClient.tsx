'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { TriangleAlert } from 'lucide-react';
import { download, slug } from '@/workbench/export/download';
import { saveReport } from '@/lib/actions/reports';
import { DRAFT_BANNER } from '@/workbench/data/constants';
import { cn } from '@/lib/utils';

interface Artifact {
  id: string;
  title: string;
  content: string;
}

export function EvidenceFactoryClient({
  artifacts,
  evalName,
  evalId,
  orgId,
  orgSlug,
  canEdit,
}: {
  artifacts: Artifact[];
  evalName: string;
  evalId: string;
  orgId: string;
  orgSlug: string;
  canEdit: boolean;
}) {
  const [selectedId, setSelectedId] = useState(artifacts[0]?.id);
  const [, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);
  const selected = artifacts.find((a) => a.id === selectedId) ?? artifacts[0];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-[oklch(0.45_0.09_75)]">
        <TriangleAlert className="h-3.5 w-3.5 shrink-0" /> {DRAFT_BANNER}
      </div>
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <div className="rounded-lg border border-border bg-card p-2">
          {artifacts.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm',
                a.id === selectedId ? 'bg-electric text-white' : 'hover:bg-muted',
              )}
            >
              <span className="w-5 text-xs opacity-70">{i + 1}</span>
              <span className="truncate">{a.title}</span>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border p-3">
            <h3 className="font-semibold">{selected?.title}</h3>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => navigator.clipboard?.writeText(selected.content)}
                className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
              >
                Copy
              </button>
              <button
                onClick={() => download(`${slug(evalName)}-${selected.id}.md`, 'text/markdown', selected.content)}
                className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
              >
                Download .md
              </button>
              {canEdit && (
                <button
                  onClick={() =>
                    startTransition(async () => {
                      const res = await saveReport(evalId, orgId, orgSlug, {
                        title: selected.title,
                        kind: 'evidence',
                        content: selected.content,
                      });
                      if (res?.error) toast.error(res.error);
                      else {
                        setSaved(selected.id);
                        toast.success(`${selected.title} saved to reports`);
                      }
                    })
                  }
                  className="rounded-md bg-navy px-3 py-1 text-xs font-medium text-white hover:bg-navy-deep"
                >
                  {saved === selected.id ? 'Saved ✓' : 'Save to reports'}
                </button>
              )}
            </div>
          </div>
          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed">
            {selected?.content}
          </pre>
        </div>
      </div>
    </div>
  );
}
