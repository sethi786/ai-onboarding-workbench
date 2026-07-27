import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Profile,
  TeamAssessment,
  TeamId,
  WorkflowStage,
} from '../types';
import { makeEmptyAssessment } from '../types';
import { DEFAULT_PROFILES } from '../data/defaultProfiles';
import { makeDefaultWorkflow } from '../data/workflowStages';

const SCHEMA_VERSION = 1;

export interface GeneratedReport {
  id: string;
  title: string;
  kind: string;
  content: string;
  createdAt: string;
}

interface UIState {
  activeTeamId: TeamId | null;
}

export interface WorkbenchState {
  schemaVersion: number;
  profiles: Record<string, Profile>;
  profileOrder: string[];
  activeProfileId: string | null;
  assessments: Record<string, Record<string, TeamAssessment>>;
  workflow: Record<string, WorkflowStage[]>;
  reports: Record<string, GeneratedReport[]>;
  ui: UIState;

  /* actions */
  setActiveProfile: (id: string) => void;
  addProfile: (p: Profile) => void;
  updateProfile: (id: string, patch: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  duplicateProfile: (id: string) => string | null;

  getAssessment: (profileId: string, teamId: TeamId) => TeamAssessment;
  updateAssessment: (
    profileId: string,
    teamId: TeamId,
    patch: Partial<TeamAssessment>,
  ) => void;
  toggleControl: (profileId: string, teamId: TeamId, controlId: string) => void;
  toggleEvidence: (profileId: string, teamId: TeamId, evidenceId: string) => void;
  toggleBlocker: (profileId: string, teamId: TeamId, blockerId: string) => void;

  getWorkflow: (profileId: string) => WorkflowStage[];
  updateWorkflowStage: (
    profileId: string,
    stageId: string,
    patch: Partial<WorkflowStage>,
  ) => void;

  saveReport: (profileId: string, report: GeneratedReport) => void;
  clearReports: (profileId: string) => void;

  importProfile: (profile: Profile, assessments?: Record<string, TeamAssessment>) => string;
  resetAll: () => void;
  setActiveTeam: (teamId: TeamId | null) => void;
}

export function genId(prefix = 'p'): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

function seedState() {
  const profiles: Record<string, Profile> = {};
  const order: string[] = [];
  DEFAULT_PROFILES.forEach((p) => {
    profiles[p.id] = { ...p };
    order.push(p.id);
  });
  return { profiles, order };
}

export const useWorkbenchStore = create<WorkbenchState>()(
  persist(
    (set, get) => {
      const seeded = seedState();
      return {
        schemaVersion: SCHEMA_VERSION,
        profiles: seeded.profiles,
        profileOrder: seeded.order,
        activeProfileId: seeded.order[0] ?? null,
        assessments: {},
        workflow: {},
        reports: {},
        ui: { activeTeamId: null },

        setActiveProfile: (id) => set({ activeProfileId: id }),

        addProfile: (p) =>
          set((s) => ({
            profiles: { ...s.profiles, [p.id]: p },
            profileOrder: [...s.profileOrder, p.id],
            activeProfileId: p.id,
          })),

        updateProfile: (id, patch) =>
          set((s) => {
            const existing = s.profiles[id];
            if (!existing) return s;
            return {
              profiles: {
                ...s.profiles,
                [id]: { ...existing, ...patch, updatedAt: new Date().toISOString() },
              },
            };
          }),

        deleteProfile: (id) =>
          set((s) => {
            const profiles = { ...s.profiles };
            delete profiles[id];
            const assessments = { ...s.assessments };
            delete assessments[id];
            const workflow = { ...s.workflow };
            delete workflow[id];
            const reports = { ...s.reports };
            delete reports[id];
            const profileOrder = s.profileOrder.filter((pid) => pid !== id);
            const activeProfileId =
              s.activeProfileId === id ? profileOrder[0] ?? null : s.activeProfileId;
            return { profiles, assessments, workflow, reports, profileOrder, activeProfileId };
          }),

        duplicateProfile: (id) => {
          const src = get().profiles[id];
          if (!src) return null;
          const newId = genId('profile');
          const copy: Profile = {
            ...src,
            id: newId,
            name: `${src.name} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const srcAssess = get().assessments[id];
          set((s) => ({
            profiles: { ...s.profiles, [newId]: copy },
            profileOrder: [...s.profileOrder, newId],
            assessments: srcAssess
              ? { ...s.assessments, [newId]: JSON.parse(JSON.stringify(srcAssess)) }
              : s.assessments,
            activeProfileId: newId,
          }));
          return newId;
        },

        getAssessment: (profileId, teamId) => {
          const a = get().assessments[profileId]?.[teamId];
          return a ?? makeEmptyAssessment(teamId);
        },

        updateAssessment: (profileId, teamId, patch) =>
          set((s) => {
            const current = s.assessments[profileId]?.[teamId] ?? makeEmptyAssessment(teamId);
            const updated: TeamAssessment = {
              ...current,
              ...patch,
              updatedAt: new Date().toISOString(),
            };
            return {
              assessments: {
                ...s.assessments,
                [profileId]: { ...s.assessments[profileId], [teamId]: updated },
              },
            };
          }),

        toggleControl: (profileId, teamId, controlId) => {
          const a = get().getAssessment(profileId, teamId);
          get().updateAssessment(profileId, teamId, {
            checkedControls: { ...a.checkedControls, [controlId]: !a.checkedControls[controlId] },
          });
        },
        toggleEvidence: (profileId, teamId, evidenceId) => {
          const a = get().getAssessment(profileId, teamId);
          get().updateAssessment(profileId, teamId, {
            checkedEvidence: { ...a.checkedEvidence, [evidenceId]: !a.checkedEvidence[evidenceId] },
          });
        },
        toggleBlocker: (profileId, teamId, blockerId) => {
          const a = get().getAssessment(profileId, teamId);
          get().updateAssessment(profileId, teamId, {
            activeBlockers: { ...a.activeBlockers, [blockerId]: !a.activeBlockers[blockerId] },
          });
        },

        getWorkflow: (profileId) => {
          const wf = get().workflow[profileId];
          if (wf) return wf;
          const fresh = makeDefaultWorkflow();
          set((s) => ({ workflow: { ...s.workflow, [profileId]: fresh } }));
          return fresh;
        },

        updateWorkflowStage: (profileId, stageId, patch) =>
          set((s) => {
            const wf = s.workflow[profileId] ?? makeDefaultWorkflow();
            const next = wf.map((st) => (st.id === stageId ? { ...st, ...patch } : st));
            return { workflow: { ...s.workflow, [profileId]: next } };
          }),

        saveReport: (profileId, report) =>
          set((s) => ({
            reports: {
              ...s.reports,
              [profileId]: [report, ...(s.reports[profileId] ?? [])].slice(0, 40),
            },
          })),

        clearReports: (profileId) =>
          set((s) => ({ reports: { ...s.reports, [profileId]: [] } })),

        importProfile: (profile, assessments) => {
          const newId = profile.id && !get().profiles[profile.id] ? profile.id : genId('import');
          const imported: Profile = { ...profile, id: newId };
          set((s) => ({
            profiles: { ...s.profiles, [newId]: imported },
            profileOrder: [...s.profileOrder, newId],
            assessments: assessments
              ? { ...s.assessments, [newId]: assessments }
              : s.assessments,
            activeProfileId: newId,
          }));
          return newId;
        },

        resetAll: () => {
          const seeded = seedState();
          set({
            profiles: seeded.profiles,
            profileOrder: seeded.order,
            activeProfileId: seeded.order[0] ?? null,
            assessments: {},
            workflow: {},
            reports: {},
            ui: { activeTeamId: null },
          });
        },

        setActiveTeam: (teamId) => set((s) => ({ ui: { ...s.ui, activeTeamId: teamId } })),
      };
    },
    {
      name: 'ai-workbench-v1',
      version: SCHEMA_VERSION,
      migrate: (persisted) => persisted as WorkbenchState,
    },
  ),
);
