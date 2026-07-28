'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { Profile, ToolCategory } from '@/workbench/types';
import { TOOL_CATEGORIES, PROJECT_TYPES_BY_CATEGORY, isAiTool } from '@/workbench/types';
import {
  PLATFORMS,
  DATA_CLASSIFICATIONS,
  ENVIRONMENTS,
  DATA_TYPE_OPTIONS,
} from '@/workbench/data/constants';
import { createEvaluation, updateEvaluation } from '@/lib/actions/evaluations';
import { AiIntakeAssist } from '@/components/portal/AiIntakeAssist';
import type { DraftedIntake } from '@/lib/ai/assist';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';

type Draft = Partial<Profile> & { name: string };

type FlagDef = { key: keyof Profile; label: string; hint: string };

/** Flags that matter regardless of what kind of tool this is. */
const UNIVERSAL_FLAGS: FlagDef[] = [
  { key: 'externalVendor', label: 'Third-party vendor', hint: 'Supplied by an outside company' },
  { key: 'pii', label: 'Personal data', hint: 'Processes personal or employee data' },
  { key: 'clientData', label: 'Client data', hint: 'Touches customer or client data' },
  { key: 'connectorEnabled', label: 'Integrations', hint: 'Connects to other systems via API or OAuth' },
  { key: 'selfHosted', label: 'Self-hosted', hint: 'You run it — you own patching and hardening' },
];

/** Flags that only make sense for AI/ML capability. */
const AI_FLAGS: FlagDef[] = [
  { key: 'agentEnabled', label: 'Agent capability', hint: 'Can plan and call tools' },
  { key: 'ragEnabled', label: 'RAG / retrieval', hint: 'Retrieves from your documents' },
  { key: 'autonomousActions', label: 'Autonomous actions', hint: 'Acts without human approval each time' },
];

/** Sensible starting flags per category, so the form matches the tool. */
const CATEGORY_DEFAULTS: Record<ToolCategory, Partial<Draft>> = {
  'SaaS application': { externalVendor: true, selfHosted: false },
  'PaaS / cloud service': { externalVendor: true, selfHosted: false },
  'On-premise software': { externalVendor: true, selfHosted: true },
  'AI / ML system': { externalVendor: true, selfHosted: false },
  'Internal build': { externalVendor: false, selfHosted: true },
};

export function EvaluationForm({
  orgId,
  orgSlug,
  evalId,
  initial,
  aiAvailable = false,
}: {
  orgId: string;
  orgSlug: string;
  evalId?: string;
  initial?: Partial<Profile>;
  aiAvailable?: boolean;
}) {
  const initialCategory: ToolCategory = initial?.toolCategory ?? 'SaaS application';

  const [d, setD] = useState<Draft>({
    name: initial?.name ?? '',
    platform: initial?.platform ?? PLATFORMS[0],
    toolCategory: initialCategory,
    toolType: initial?.toolType ?? PROJECT_TYPES_BY_CATEGORY[initialCategory][0],
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
    selfHosted: initial?.selfHosted ?? CATEGORY_DEFAULTS[initialCategory].selfHosted ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  const category = (d.toolCategory ?? 'SaaS application') as ToolCategory;
  const projectTypes = PROJECT_TYPES_BY_CATEGORY[category];
  // Mirrors the engine's own rule so the form shows exactly the fields that
  // will affect scoring.
  const showAi = isAiTool({
    toolCategory: category,
    agentEnabled: Boolean(d.agentEnabled),
    ragEnabled: Boolean(d.ragEnabled),
    autonomousActions: Boolean(d.autonomousActions),
  });

  /** Changing category re-scopes the project type and re-applies defaults. */
  function changeCategory(next: ToolCategory) {
    const types = PROJECT_TYPES_BY_CATEGORY[next];
    const keepType = d.toolType && types.includes(d.toolType);
    set({
      toolCategory: next,
      toolType: keepType ? d.toolType : types[0],
      ...CATEGORY_DEFAULTS[next],
    });
  }

  /**
   * Land an AI draft in the form. Category goes through changeCategory so the
   * project type stays valid, then the drafted flags are re-applied — otherwise
   * the category defaults would quietly overwrite what was just read from the
   * description.
   */
  function applyDraft(draft: DraftedIntake) {
    const nextCategory = (TOOL_CATEGORIES as string[]).includes(draft.toolCategory)
      ? (draft.toolCategory as ToolCategory)
      : category;
    const types = PROJECT_TYPES_BY_CATEGORY[nextCategory];
    setD((prev) => ({
      ...prev,
      ...CATEGORY_DEFAULTS[nextCategory],
      toolCategory: nextCategory,
      toolType: prev.toolType && types.includes(prev.toolType) ? prev.toolType : types[0],
      name: draft.name || prev.name,
      platform: draft.platform || prev.platform,
      useCase: draft.useCase || prev.useCase,
      targetUsers: draft.targetUsers || prev.targetUsers,
      environment: draft.environment as Profile['environment'],
      dataClassification: draft.dataClassification as Profile['dataClassification'],
      dataTypes: draft.dataTypes,
      agentEnabled: draft.agentEnabled,
      connectorEnabled: draft.connectorEnabled,
      ragEnabled: draft.ragEnabled,
      externalVendor: draft.externalVendor,
      selfHosted: draft.selfHosted,
      pii: draft.pii,
      clientData: draft.clientData,
      autonomousActions: draft.autonomousActions,
    }));
  }

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
      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
      } else if (evalId) {
        toast.success('Changes saved');
      }
    });

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {!evalId && (
        <AiIntakeAssist orgId={orgId} available={aiAvailable} onApply={applyDraft} />
      )}

      <Section title="What are you adopting?">
        <Field label="Category">
          <div className="grid gap-2 pt-1 sm:grid-cols-3">
            {TOOL_CATEGORIES.map((c) => {
              const on = category === c;
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => changeCategory(c)}
                  className={
                    'rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ' +
                    (on
                      ? 'border-electric bg-electric/10 text-electric'
                      : 'border-border bg-background hover:bg-muted')
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>
          <p className="pt-2 text-xs text-muted-foreground">
            This decides which review lenses apply. AI-specific reviews are skipped for tools that
            aren’t AI; build and hardening reviews are skipped for software you don’t run yourself.
          </p>
        </Field>

        <Grid>
          <Field label="Name">
            <Input value={d.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Vendor / platform">
            {/* Free text with suggestions: the preset list only covers AI
                platforms, and this reviews any tool. */}
            <Input
              value={d.platform}
              list="vendor-suggestions"
              placeholder="e.g. Salesforce, Northwind Software, internal"
              onChange={(e) => set({ platform: e.target.value })}
            />
            <datalist id="vendor-suggestions">
              {PLATFORMS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>
          <Field label="Type">
            <Select
              value={d.toolType}
              onChange={(e) => set({ toolType: e.target.value as Profile['toolType'] })}
            >
              {projectTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          {showAi && (
            <Field label="Model">
              <Input
                value={d.model}
                placeholder="e.g. GPT-4o, Claude, Gemini"
                onChange={(e) => set({ model: e.target.value })}
              />
            </Field>
          )}
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

      <Section title="Characteristics (these drive review intensity)">
        <FlagGrid flags={UNIVERSAL_FLAGS} draft={d} set={set} />
      </Section>

      {(category === 'AI / ML system' || showAi) && (
        <Section title="AI capability">
          <FlagGrid flags={AI_FLAGS} draft={d} set={set} />
        </Section>
      )}

      <div className="flex justify-end">
        <Button variant="electric" size="lg" onClick={submit} disabled={pending}>
          {pending ? 'Saving…' : evalId ? 'Save changes' : 'Create evaluation'}
        </Button>
      </div>
    </div>
  );
}

function FlagGrid({
  flags,
  draft,
  set,
}: {
  flags: FlagDef[];
  draft: Draft;
  set: (p: Partial<Draft>) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {flags.map((f) => (
        <label
          key={String(f.key)}
          className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
        >
          <input
            type="checkbox"
            className="mt-0.5"
            checked={Boolean(draft[f.key])}
            onChange={(e) => set({ [f.key]: e.target.checked } as Partial<Draft>)}
          />
          <span>
            <span className="block text-sm font-medium">{f.label}</span>
            <span className="block text-xs text-muted-foreground">{f.hint}</span>
          </span>
        </label>
      ))}
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
