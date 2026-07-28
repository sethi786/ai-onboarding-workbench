'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Minus } from 'lucide-react';
import { scopePreview, SCOPE_DEFAULTS, type ScopeAnswers } from '@/lib/scope-preview';
import { DATA_CLASSIFICATIONS, ENVIRONMENTS } from '@/workbench/data/constants';
import { LensIcon } from '@/components/icons/LensIcon';
import type { Profile } from '@/workbench/types';

/**
 * Scope a review for any tool, without an account.
 *
 * The engine is pure, so this runs entirely in the browser: no request, no key,
 * nothing recorded. That matters for the audience — somebody evaluating a
 * governance product is not going to type their unreviewed AI tools into a
 * stranger's server to see a demo.
 */

const SUGGESTIONS = [
  'Microsoft 365 Copilot',
  'ChatGPT Enterprise',
  'Claude Enterprise',
  'Salesforce',
  'Snowflake',
  'Notion AI',
  'Otter.ai',
  'Slack',
];

const TOGGLES: { key: keyof ScopeAnswers; label: string; hint: string }[] = [
  { key: 'pii', label: 'Holds personal data', hint: 'Names, contact details, HR or customer records' },
  { key: 'clientData', label: 'Holds client data', hint: 'Material your clients would consider theirs' },
  { key: 'connectorEnabled', label: 'Connects to your systems', hint: 'Reads mail, files, a CRM, a database' },
  { key: 'autonomousActions', label: 'Acts on its own', hint: 'Sends, files, or changes things without approval' },
  { key: 'selfHosted', label: 'You host or build it', hint: 'Runs on your infrastructure, not the vendor’s' },
];

export function ScopeTool() {
  const [tool, setTool] = useState('Microsoft 365 Copilot');
  const [answers, setAnswers] = useState<ScopeAnswers>({
    ...SCOPE_DEFAULTS,
    environment: 'Production',
    dataClassification: 'Confidential',
    pii: true,
    connectorEnabled: true,
  });

  const result = useMemo(() => scopePreview(tool, answers), [tool, answers]);
  const set = <K extends keyof ScopeAnswers>(key: K, value: ScopeAnswers[K]) =>
    setAnswers((a) => ({ ...a, [key]: value }));

  const saved = result.controlsIfUnscoped - result.controlsAsked;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* ------------------------------------------------------------ inputs */}
      <div className="space-y-5 rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24 lg:self-start">
        <div>
          <label htmlFor="scope-tool" className="text-[13px] font-semibold">
            What are you adopting?
          </label>
          <input
            id="scope-tool"
            value={tool}
            onChange={(e) => setTool(e.target.value)}
            placeholder="Any tool — a copilot, a CRM, a database"
            className="mt-2 h-11 w-full rounded-lg border border-border bg-paper px-3.5 text-[15px] outline-none focus:border-electric"
          />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTool(s)}
                className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                  tool === s
                    ? 'border-electric bg-electric/10 text-electric'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            {result.matched
              ? `Recognised — using our defaults for ${result.matchedName}, which you can override below.`
              : 'Not in our library, so this is scoped purely from your answers.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Where it runs">
            <select
              value={answers.environment}
              onChange={(e) => set('environment', e.target.value as Profile['environment'])}
              className="h-10 w-full rounded-lg border border-border bg-paper px-2.5 text-[14px] outline-none focus:border-electric"
            >
              {ENVIRONMENTS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Data it touches">
            <select
              value={answers.dataClassification}
              onChange={(e) =>
                set('dataClassification', e.target.value as Profile['dataClassification'])
              }
              className="h-10 w-full rounded-lg border border-border bg-paper px-2.5 text-[14px] outline-none focus:border-electric"
            >
              {DATA_CLASSIFICATIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="space-y-1">
          {TOGGLES.map((t) => (
            <label key={t.key} className="flex cursor-pointer items-start gap-2.5 py-1.5">
              <input
                type="checkbox"
                className="mt-1"
                checked={answers[t.key] as boolean}
                onChange={(e) => set(t.key, e.target.checked as never)}
              />
              <span>
                <span className="block text-[14px] font-medium">{t.label}</span>
                <span className="block text-[12.5px] leading-snug text-muted-foreground">
                  {t.hint}
                </span>
              </span>
            </label>
          ))}
        </div>

        <p className="border-t border-border pt-4 text-[12.5px] leading-relaxed text-muted-foreground">
          Everything here is computed in your browser by the same engine the product runs. Nothing
          is sent anywhere and nothing is stored.
        </p>
      </div>

      {/* ----------------------------------------------------------- results */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-4xl font-semibold tracking-tight">
              {result.required.length}
            </span>
            <span className="text-lg text-muted-foreground">
              of {result.totalLenses} reviews apply
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-4">
            <Stat label="Review depth" value={result.depth} />
            <Stat label="Inherent risk" value={result.risk} />
            <Stat label="Controls asked" value={String(result.controlsAsked)} />
            <Stat label="Documents to collect" value={String(result.evidenceAsked)} />
          </div>
          {saved > 0 && (
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              A review that ignored scope would put{' '}
              <span className="font-semibold text-foreground">{result.controlsIfUnscoped}</span>{' '}
              controls in front of you. Scoping to this tool removes{' '}
              <span className="font-semibold text-foreground">{saved}</span> of them — and every one
              removed is defended below.
            </p>
          )}
        </div>

        <Panel
          title={`Reviews that apply (${result.required.length})`}
          note="Each one is here because of something specific about this tool."
        >
          {result.required.map((r) => (
            <div key={r.id} className="flex gap-3 border-t border-border px-6 py-4 first:border-0">
              <LensIcon id={r.id} className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2.5">
                  <span className="font-semibold">{r.title}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {r.depth}
                  </span>
                  <span className="text-[12.5px] text-muted-foreground">
                    {r.controls} controls · {r.evidence} documents
                  </span>
                </div>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                  {r.explanation.reason}
                </p>
              </div>
            </div>
          ))}
        </Panel>

        {result.skipped.length > 0 && (
          <Panel
            title={`Reviews you can skip (${result.skipped.length})`}
            note="With the reason, and what would change it — so a sceptical reviewer can check the call."
          >
            {result.skipped.map((r) => (
              <div key={r.id} className="flex gap-3 border-t border-border px-6 py-4 first:border-0">
                <Minus className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/60" />
                <div className="min-w-0">
                  <span className="font-semibold text-muted-foreground">{r.title}</span>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                    {r.explanation.reason}
                  </p>
                  {r.explanation.wouldApplyIf.length > 0 && (
                    <p className="mt-1.5 text-[13px] text-muted-foreground/85">
                      Would apply if {r.explanation.wouldApplyIf.slice(0, 3).join(', or ')}.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </Panel>
        )}

        {result.frameworks.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Regulation these reviews evidence
            </h3>
            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
              {result.frameworks.map((f) => (
                <div key={f.id}>
                  <div className="font-medium">{f.name}</div>
                  <div className="text-[13px] text-muted-foreground">
                    {f.clauses} obligations mapped
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-sand p-6">
          <h3 className="text-lg font-semibold tracking-tight">
            That&rsquo;s the scope. The reviews themselves are the product.
          </h3>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-foreground/70">
            Inside, each control carries the concrete test for whether it&rsquo;s done, the AI drafts
            the first pass of every section, and you finish with a branded review document, four
            generated diagrams, and the answers to what your security team will ask.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium text-paper transition-transform hover:scale-[1.02]"
            >
              Run this review free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/example-review"
              className="group inline-flex items-center gap-1.5 text-[15px] font-medium"
            >
              See a finished one first
              <span className="text-electric transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-foreground/60">
            <Check className="h-3.5 w-3.5" /> One tool, three seats, the whole pack. No card.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{note}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
