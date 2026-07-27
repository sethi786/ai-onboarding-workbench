'use client';

import { useState, useTransition } from 'react';
import type { Decision, TeamAssessment, TeamId, ScoreResult } from '@/workbench/types';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { DECISION_OPTIONS } from '@/workbench/data/constants';
import { updateAssessment } from '@/lib/actions/assessments';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input, Select } from '@/components/ui/input';
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
  const [, startTransition] = useTransition();

  const patch = (teamId: TeamId, p: Partial<TeamAssessment>) => {
    setState((prev) => ({ ...prev, [teamId]: { ...prev[teamId], ...p } }));
    if (canEdit) startTransition(() => { updateAssessment(evalId, orgId, orgSlug, teamId, p); });
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="p-2 pl-3">Team</th>
            <th className="p-2">Required</th>
            <th className="p-2 w-40">Readiness</th>
            <th className="p-2">Decision</th>
            <th className="p-2">Owner</th>
            <th className="p-2">Due</th>
          </tr>
        </thead>
        <tbody>
          {TEAM_LENSES.map((lens) => {
            const ts = score.perTeam[lens.id];
            const a = state[lens.id];
            return (
              <tr key={lens.id} className="border-b border-border last:border-0">
                <td className="p-2 pl-3 font-medium">{lens.icon} {lens.title}</td>
                <td className="p-2">{ts.required ? <Badge tone="electric">Required</Badge> : <span className="text-muted-foreground">—</span>}</td>
                <td className="p-2"><Progress value={ts.normalized} showLabel /></td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Select value={a.decision} disabled={!canEdit} onChange={(e) => patch(lens.id, { decision: e.target.value as Decision })} className="h-8 min-w-[160px]">
                      {DECISION_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                    </Select>
                    <Badge tone={decisionTone(a.decision)}>{a.decision}</Badge>
                  </div>
                </td>
                <td className="p-2"><Input value={a.owner} disabled={!canEdit} className="h-8 min-w-[110px]" onChange={(e) => patch(lens.id, { owner: e.target.value })} /></td>
                <td className="p-2"><Input type="date" value={a.dueDate} disabled={!canEdit} className="h-8" onChange={(e) => patch(lens.id, { dueDate: e.target.value })} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
