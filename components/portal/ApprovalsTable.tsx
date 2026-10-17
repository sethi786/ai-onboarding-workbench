'use client';

import { useState, useEffect } from 'react';
import { useGovernanceSave } from './useGovernanceSave';
import type { Decision, TeamAssessment, TeamId, ScoreResult } from '@/workbench/types';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { DECISION_OPTIONS } from '@/workbench/data/constants';
import { updateAssessment } from '@/lib/actions/assessments';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input, Select } from '@/components/ui/input';
import { LensIcon } from '@/components/icons/LensIcon';
import { decisionTone } from './status';

export function ApprovalsTable({
  assessments,
  score,
  evalId,
  orgId,
  orgSlug,
  canEdit,
}: {
  assessments: Record<TeamId, TeamAssessment>;
  score: ScoreResult;
  evalId: string;
  orgId: string;
  orgSlug: string;
  canEdit: boolean;
}) {
  const [state, setState] = useState(assessments);
  const { save, pending, error } = useGovernanceSave();
  const [dirty, setDirty] = useState<string[]>([]);
  useEffect(() => { if (!dirty.length) setState(assessments); }, [assessments, dirty]);

  const patch = (teamId: TeamId, p: Partial<TeamAssessment>) => {
    if (!canEdit || pending) return;
    setDirty((prev) => prev.includes(teamId) ? prev : [...prev, teamId]);
    setState((prev) => ({ ...prev, [teamId]: { ...prev[teamId], ...p } }));

  };

  const persist = (teamId: TeamId) => {
    const { decision, owner, dueDate } = state[teamId];
    save(() => updateAssessment(evalId, orgId, orgSlug, teamId, { decision, owner, dueDate }), () => setDirty((prev) => prev.filter((id) => id !== teamId)));
  };
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      {error && <p role="alert" className="p-3 text-sm text-danger">Not saved: {error}</p>}
      {!!dirty.length && <p role="status" className="p-3 text-xs text-muted-foreground">Unsaved changes in {dirty.length} row(s). Use each row’s Save button.</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="p-2 pl-3">Team</th>
            <th className="p-2">Required</th>
            <th className="p-2 w-40">Readiness</th>
            <th className="p-2">Self-reported decision</th>
            <th className="p-2">Owner</th>
            <th className="p-2">Due</th><th className="p-2">Save</th>
          </tr>
        </thead>
        <tbody>
          {TEAM_LENSES.map((lens) => {
            const ts = score.perTeam[lens.id];
            const a = state[lens.id];
            return (
              <tr key={lens.id} className="border-b border-border last:border-0">
                <td className="p-2 pl-3 font-medium">
                  <span className="flex items-center gap-2">
                    <LensIcon id={lens.id} className="h-3.5 w-3.5 text-muted-foreground" />
                    {lens.title}
                  </span>
                </td>
                <td className="p-2">{ts.required ? <Badge tone="electric">Required</Badge> : <span className="text-muted-foreground">—</span>}</td>
                <td className="p-2"><Progress value={ts.normalized} showLabel /></td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Select value={a.decision} disabled={!canEdit || pending} onChange={(e) => patch(lens.id, { decision: e.target.value as Decision })} className="h-8 min-w-[160px]">
                      {DECISION_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                    </Select>
                    <Badge tone={decisionTone(a.decision)}>{a.decision}</Badge>
                  </div>
                </td>
                <td className="p-2"><Input value={a.owner} disabled={!canEdit || pending} className="h-8 min-w-[110px]" onChange={(e) => patch(lens.id, { owner: e.target.value })} /></td>
                <td className="p-2"><Input type="date" value={a.dueDate} disabled={!canEdit || pending} className="h-8" onChange={(e) => patch(lens.id, { dueDate: e.target.value })} /></td>
                <td className="p-2"><button disabled={!canEdit || pending || !dirty.includes(lens.id)} onClick={() => persist(lens.id)} className="rounded border px-2 py-1 disabled:opacity-50">{pending ? 'Saving…' : dirty.includes(lens.id) ? 'Save changes' : 'Saved'}</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
