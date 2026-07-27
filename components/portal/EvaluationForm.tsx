'use client';

import { useState, useTransition } from 'react';
import type { Profile } from '@/workbench/types';
import {
  PLATFORMS,
  PROJECT_TYPES,
  DATA_CLASSIFICATIONS,
  ENVIRONMENTS,
  DATA_TYPE_OPTIONS,
} from '@/workbench/data/constants';
import { createEvaluation, updateEvaluation } from '@/lib/actions/evaluations';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';

type Draft = Partial<Profile> & { name: string };

const FLAGS: { key: keyof Profile; label: string }[] = [
  { key: 'agentEnabled', label: 'Agent enabled' },
  { key: 'connectorEnabled', label: 'Connector enabled' },
  { key: 'ragEnabled', label: 'RAG enabled' },
  { key: 'externalVendor', label: 'External vendor' },
  { key: 'clientData', label: 'Client data' },
  { key: 'pii', label: 'PII involved' },
  { key: 'autonomousActions', label: 'Autonomous actions' },
];

export function EvaluationForm({
  orgId,
  orgSlug,
  evalId,
  initial,
}: {
  orgId: string;
  orgSlug: string;
  evalId?: string;
  initial?: Partial<Profile>;
}) {
  const [d, setD] = useState<Draft>({
    name: initial?.name ?? '',
    platform: initial?.platform ?? PLATFORMS[0],
    toolType: initial?.toolType ?? PROJECT_TYPES[1],
    model: initial?.model ?? '',
    useCase: initial?.useCase ?? '',
    businessOwner: initial?.businessOwner ?? '',
    technicalOwner: initial?.technicalOwner ?? '',
    executiveSponsor: initial?.executiveSponsor ?? '',
    targetUsers: initial?.targetUsers ?? '',
    dataClassification: initial?.dataClassification ?? 'Internal',
    environment: initial?.environment ?? 'Sandbox',
    dataTypes: initial?.dataTypes ?? [],
    agentEnabled: initial?.agentEnabled ?? false,
    connectorEnabled: initial?.connectorEnabled ?? false,
    ragEnabled: initial?.ragEnabled ?? false,
    externalVendor: initial?.externalVendor ?? true,
    clientData: initial?.clientData ?? false,
    pii: initial?.pii ?? false,
    autonomousActions: initial?.autonomousActions ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  const toggleDataType = (dt: string) =>
    set({
      dataTypes: d.dataTypes?.includes(dt)
        ? d.dataTypes.filter((x) => x !== dt)
        : [...(d.dataTypes ?? []), dt],
    });

  const submit = () =>
    startTransition(async () => {
      setError(null);
      if (!d.name.trim()) {
        setError('Name is required.');
        return;
      }
      const res = evalId
        ? await updateEvaluation(evalId, orgSlug, d)
        : await createEvaluation(orgId, orgSlug, d);
      if (res?.error) setError(res.error);
    });

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <Section title="Identity">
        <Grid>
          <Field label="Name">
            <Input value={d.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Platform">
            <Select value={d.platform} onChange={(e) => set({ platform: e.target.value })}>
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Tool / project type">
            <Select
              value={d.toolType}
              onChange={(e) => set({ toolType: e.target.value as Profile['toolType'] })}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Model">
            <Input value={d.model} onChange={(e) => set({ model: e.target.value })} />
          </Field>
        </Grid>
        <Field label="Use case">
          <Textarea value={d.useCase} onChange={(e) => set({ useCase: e.target.value })} />
        </Field>
      </Section>

      <Section title="Ownership">
        <Grid>
          <Field label="Business owner">
            <Input value={d.businessOwner} onChange={(e) => set({ businessOwner: e.target.value })} />
          </Field>
          <Field label="Technical owner">
            <Input value={d.technicalOwner} onChange={(e) => set({ technicalOwner: e.target.value })} />
          </Field>
          <Field label="Executive sponsor">
            <Input value={d.executiveSponsor} onChange={(e) => set({ executiveSponsor: e.target.value })} />
          </Field>
          <Field label="Target users">
            <Input value={d.targetUsers} onChange={(e) => set({ targetUsers: e.target.value })} />
          </Field>
        </Grid>
      </Section>

      <Section title="Data & environment">
        <Grid>
          <Field label="Data classification">
            <Select
              value={d.dataClassification}
              onChange={(e) => set({ dataClassification: e.target.value as Profile['dataClassification'] })}
            >
              {DATA_CLASSIFICATIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Environment">
            <Select
              value={d.environment}
              onChange={(e) => set({ environment: e.target.value as Profile['environment'] })}
            >
              {ENVIRONMENTS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </Grid>
        <Field label="Data types">
          <div className="flex flex-wrap gap-2 pt-1">
            {DATA_TYPE_OPTIONS.map((dt) => {
              const on = d.dataTypes?.includes(dt);
              return (
                <button
                  type="button"
                  key={dt}
                  onClick={() => toggleDataType(dt)}
                  className={
                    'rounded-md border px-2.5 py-1 text-xs font-medium ' +
                    (on
                      ? 'border-electric bg-electric/10 text-electric'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted')
                  }
                >
                  {dt}
                </button>
              );
            })}
          </div>
        </Field>
      </Section>

      <Section title="Capability flags (drive review intensity)">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {FLAGS.map((f) => (
            <label key={String(f.key)} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(d[f.key])}
                onChange={(e) => set({ [f.key]: e.target.checked } as Partial<Draft>)}
              />
              {f.label}
            </label>
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <Button variant="electric" size="lg" onClick={submit} disabled={pending}>
          {pending ? 'Saving…' : evalId ? 'Save changes' : 'Create evaluation'}
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-border p-4">
      <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-electric">
        {title}
      </legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
