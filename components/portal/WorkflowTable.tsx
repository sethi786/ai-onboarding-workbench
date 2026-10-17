'use client';

import { useState, useEffect } from 'react';
import { useGovernanceSave } from './useGovernanceSave';
import { useDirtyForm } from './UnsavedChanges';
import type { WorkflowStage } from '@/workbench/types';
import { updateWorkflowStage } from '@/lib/actions/workflow';
import { Badge } from '@/components/ui/badge';
import { Input, Select } from '@/components/ui/input';
import { stageTone } from './workflow-tone';

const STATUSES = [
  'Not Started',
  'In Progress',
  'Complete',
  'Blocked',
  'Skipped',
];
const DECISIONS = [
  'Not Reviewed',
  'Approved',
  'Approved with Conditions',
  'Needs Remediation',
  'Blocked',
];

export function WorkflowTable({
  stages,
  evalId,
  orgSlug,
  canEdit,
}: {
  stages: WorkflowStage[];
  evalId: string;
  orgSlug: string;
  canEdit: boolean;
}) {
  const [rows, setRows] = useState(stages);
  const { save, pending, error } = useGovernanceSave();
  const [dirty, setDirty] = useState<string[]>([]);
  useDirtyForm(dirty.length > 0);
  useEffect(() => {
    if (!dirty.length) setRows(stages);
  }, [stages, dirty]);

  const update = (key: string, patch: Partial<WorkflowStage>) => {
    if (!canEdit || pending) return;
    setDirty((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setRows((prev) => prev.map((s) => (s.id === key ? { ...s, ...patch } : s)));
  };

  const persist = (key: string) => {
    const row = rows.find((r) => r.id === key)!;
    const { status, owner, dueDate, decision, notes, evidence, blocker } = row;
    save(
      () =>
        updateWorkflowStage(evalId, orgSlug, key, {
          status,
          owner,
          dueDate,
          decision,
          notes,
          evidence,
          blocker,
        }),
      () => setDirty((prev) => prev.filter((id) => id !== key)),
    );
  };
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      {error && (
        <p role="alert" className="p-3 text-sm text-danger">
          Not saved: {error}
        </p>
      )}
      {!!dirty.length && (
        <p role="status" className="p-3 text-xs text-muted-foreground">
          Unsaved changes in {dirty.length} row(s). Use each row’s Save button.
        </p>
      )}
      <table className="responsive-record-table w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="p-2 pl-3">#</th>
            <th className="p-2">Stage</th>
            <th className="p-2">Status</th>
            <th className="p-2">Owner</th>
            <th className="p-2">Due</th>
            <th className="p-2">Decision</th>
            <th className="p-2">Notes</th>
            <th className="p-2">Save</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-b border-border last:border-0">
              <td data-label="Step" className="p-2 pl-3 text-muted-foreground">
                {s.order}
              </td>
              <td data-label="Stage" className="p-2 font-medium">
                {s.name}
              </td>
              <td data-label="Status" className="p-2">
                <Select
                  aria-label={`Status for ${s.name}`}
                  value={s.status}
                  disabled={!canEdit || pending}
                  onChange={(e) =>
                    update(s.id, {
                      status: e.target.value as WorkflowStage['status'],
                    })
                  }
                  className="mb-1 h-8"
                >
                  {STATUSES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </Select>
                <Badge
                  className="hidden md:inline-flex"
                  tone={stageTone(s.status)}
                >
                  {s.status}
                </Badge>
              </td>
              <td data-label="Owner" className="p-2">
                <Input
                  aria-label={`Owner for ${s.name}`}
                  value={s.owner}
                  disabled={!canEdit || pending}
                  className="h-8 min-w-[110px]"
                  onChange={(e) => update(s.id, { owner: e.target.value })}
                />
              </td>
              <td data-label="Due date" className="p-2">
                <Input
                  type="date"
                  aria-label={`Due date for ${s.name}`}
                  value={s.dueDate}
                  disabled={!canEdit || pending}
                  className="h-8"
                  onChange={(e) => update(s.id, { dueDate: e.target.value })}
                />
              </td>
              <td data-label="Decision" className="p-2">
                <Select
                  aria-label={`Decision for ${s.name}`}
                  value={s.decision}
                  disabled={!canEdit || pending}
                  onChange={(e) =>
                    update(s.id, {
                      decision: e.target.value as WorkflowStage['decision'],
                    })
                  }
                  className="h-8 min-w-[150px]"
                >
                  {DECISIONS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </Select>
              </td>
              <td data-label="Notes" className="p-2">
                <Input
                  aria-label={`Notes for ${s.name}`}
                  value={s.notes}
                  disabled={!canEdit || pending}
                  className="h-8 min-w-[140px]"
                  placeholder="notes / blocker"
                  onChange={(e) => update(s.id, { notes: e.target.value })}
                />
              </td>
              <td data-label="Save" className="p-2">
                <button
                  disabled={!canEdit || pending || !dirty.includes(s.id)}
                  onClick={() => persist(s.id)}
                  className="rounded border px-2 py-1 disabled:opacity-50"
                >
                  {pending
                    ? 'Saving…'
                    : dirty.includes(s.id)
                      ? 'Save changes'
                      : 'Saved'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
