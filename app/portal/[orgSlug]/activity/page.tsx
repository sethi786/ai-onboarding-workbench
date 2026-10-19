import Link from 'next/link';
import { History, ArrowLeft, ArrowRight } from 'lucide-react';
import { requireMembership } from '@/lib/auth/membership';
import { requireUser } from '@/lib/auth/require-user';
import type { WorkspaceActivityRow } from '@/lib/db/types';
import { createClient } from '@/lib/supabase/server';

const ENTITY_LABELS: Record<string, string> = {
  evaluations: 'Evaluation',
  team_assessments: 'Assessment',
  evidence_links: 'Evidence reference',
  workflow_stages: 'Workflow stage',
  generated_reports: 'Report',
  memberships: 'Member access',
  invitations: 'Invitation',
  organizations: 'Workspace',
};

export default async function ActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ page?: string; evaluation?: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await requireMembership(orgSlug);
  const user = await requireUser();
  const search = await searchParams;
  const page =
    typeof search.page === 'string' && /^\d{1,4}$/.test(search.page)
      ? Math.max(1, Math.min(200, Number(search.page)))
      : 1;
  const evaluation =
    typeof search.evaluation === 'string' &&
    /^[a-f0-9-]{36}$/i.test(search.evaluation)
      ? search.evaluation
      : '';
  const supabase = await createClient();
  let query = supabase
    .from('workspace_activity')
    .select('*')
    .eq('org_id', org.id);
  if (evaluation) query = query.eq('evaluation_id', evaluation);
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range((page - 1) * 50, page * 50);
  if (error)
    throw new Error(
      'Could not load activity. Check that the workspace migration is installed and retry.',
    );
  const events = ((data ?? []) as WorkspaceActivityRow[]).slice(0, 50);
  const ids = [
    ...new Set(
      events.map((e) => e.evaluation_id).filter((id): id is string => !!id),
    ),
  ];
  const { data: evaluations, error: evalError } = ids.length
    ? await supabase
        .from('evaluations')
        .select('id,name')
        .eq('org_id', org.id)
        .in('id', ids)
    : { data: [], error: null };
  if (evalError)
    throw new Error('Could not load activity details. Please retry.');
  const names = new Map(evaluations?.map((e) => [e.id, e.name]));
  const pageHref = (n: number) =>
    `/portal/${orgSlug}/activity?${new URLSearchParams({ page: String(n), ...(evaluation ? { evaluation } : {}) })}`;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-electric">
          Workspace record
        </p>
        <h1 className="text-3xl font-semibold">Activity history</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          A database record of assessment, evidence, workflow, and access
          changes. Events record who changed which fields, without copying
          evidence documents or private notes.
        </p>
      </div>
      {evaluation && (
        <Link
          href={`/portal/${orgSlug}/activity`}
          className="inline-block text-sm text-electric"
        >
          Show all workspace activity
        </Link>
      )}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {!events.length ? (
          <div className="p-10 text-center">
            <History className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
            <h2 className="font-semibold">No activity on this page</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              New changes appear here after activity recording is enabled.
              Historical changes are not backfilled.
            </p>
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id} className="flex gap-4 p-5">
                <span
                  aria-hidden
                  className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-electric/10 text-electric"
                >
                  <History className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h2 className="text-sm font-semibold">
                      {ENTITY_LABELS[event.entity_type] ?? 'Record'}{' '}
                      {event.action}
                    </h2>
                    <time
                      dateTime={event.created_at}
                      className="text-xs text-muted-foreground"
                    >
                      {new Date(event.created_at).toLocaleString('en-CA', {
                        timeZone: 'UTC',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}{' '}
                      UTC
                    </time>
                  </div>
                  {event.evaluation_id && (
                    <p className="mt-1 break-words text-sm">
                      {names.has(event.evaluation_id) ? (
                        <Link
                          className="text-electric hover:underline"
                          href={`/portal/${orgSlug}/evaluations/${event.evaluation_id}`}
                        >
                          {names.get(event.evaluation_id)}
                        </Link>
                      ) : (
                        'Deleted evaluation'
                      )}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {event.actor_id === user.id
                      ? 'You'
                      : event.actor_id
                        ? `Workspace user ${event.actor_id.slice(0, 8)}`
                        : 'System or migration'}{' '}
                    · Reference {event.id.slice(0, 8)}
                  </p>
                  {event.action === 'updated' && (
                    <p className="mt-2 break-words text-xs text-muted-foreground">
                      Fields:{' '}
                      {event.changed_fields
                        .map((field) => field.replaceAll('_', ' '))
                        .join(', ')}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
      <nav
        aria-label="Activity pages"
        className="flex items-center justify-between gap-4 text-sm"
      >
        <span>Page {page}</span>
        <div className="flex gap-4">
          {page > 1 && (
            <Link
              className="inline-flex items-center gap-2 text-electric"
              href={pageHref(page - 1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Newer
            </Link>
          )}
          {(data?.length ?? 0) > 50 && page < 200 && (
            <Link
              className="inline-flex items-center gap-2 text-electric"
              href={pageHref(page + 1)}
            >
              Older
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </nav>
      <p className="text-xs text-muted-foreground">
        Workspace members can read this history. Application users cannot edit
        events; authorized database operators can manage retention. This is an
        operational record, not a signed approval or independent audit
        attestation.
      </p>
    </div>
  );
}

export const dynamic = 'force-dynamic';
