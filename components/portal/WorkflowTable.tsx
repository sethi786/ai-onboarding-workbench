'use client';

import { useState, useTransition } from 'react';
import type { WorkflowStage } from '@/workbench/types';
import { updateWorkflowStage } from '@/lib/actions/workflow';
import { Badge } from '@/components/ui/badge';
import { Input, Select } from '@/components/ui/input';
import { stageTone } from './workflow-tone';

const STATUSES = ['Not Started', 'In Progress', 'Complete', 'Blocked', 'Skipped'];
const DECISIONS = ['Not Reviewed', 'Approved', 'Approved with Conditions', 'Needs Remediation', 'Blocked'];

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
  const [, startTransition] = useTransition();

  const update = (key: string, patch: Partial<WorkflowStage>) => {
    setRows((prev) => prev.map((s) => (s.id === key ? { ...s, ...patch } : s)));
    if (canEdit) startTransition(() => { updateWorkflowStage(evalId, orgSlug, key, patch); });
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="p-2 pl-3">#</th>
            <th className="p-2">Stage</th>
            <th className="p-2">Status</th>
            <th className="p-2">Owner</th>
            <th className="p-2">Due</th>
            <th className="p-2">Decision</th>
            <th className="p-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-b border-border last:border-0">
              <td className="p-2 pl-3 text-muted-foreground">{s.order}</td>
              <td className="p-2 font-medium">{s.name}</td>
              <td className="p-2">
                <Select value={s.status} disabled={!canEdit} onChange={(e) => update(s.id, { status: e.target.value as WorkflowStage['status'] })} className="mb-1 h-8">
                  {STATUSES.map((x) => <option key={x}>{x}</option>)}
                </Select>
                <Badge tone={stageTone(s.status)}>{s.status}</Badge>
              </td>
              <td className="p-2"><Input value={s.owner} disabled={!canEdit} className="h-8 min-w-[110px]" onChange={(e) => update(s.id, { owner: e.target.value })} /></td>
              <td className="p-2"><Input type="date" value={s.dueDate} disabled={!canEdit} className="h-8" onChange={(e) => update(s.id, { dueDate: e.target.value })} /></td>
              <td className="p-2">
                <Select value={s.decision} disabled={!canEdit} onChange={(e) => update(s.id, { decision: e.target.value as WorkflowStage['decision'] })} className="h-8 min-w-[150px]">
                  {DECISIONS.map((x) => <option key={x}>{x}</option>)}
                </Select>
              </td>
              <td className="p-2"><Input value={s.notes} disabled={!canEdit} className="h-8 min-w-[140px]" placeholder="notes / blocker" onChange={(e) => update(s.id, { notes: e.target.value })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
