import type { ComponentType } from 'react';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import SelfEvaluationCenter from './pages/SelfEvaluationCenter';
import TeamLensLibrary from './pages/TeamLensLibrary';
import IntakeRegister from './pages/IntakeRegister';
import WorkflowStages from './pages/WorkflowStages';
import ArchitecturePage from './pages/ArchitecturePage';
import SecuritySAR from './pages/SecuritySAR';
import PrivacyPIA from './pages/PrivacyPIA';
import LegalOGC from './pages/LegalOGC';
import DataGovernance from './pages/DataGovernance';
import AgentGovernance from './pages/AgentGovernance';
import SecureSDLC from './pages/SecureSDLC';
import PlatformMatrix from './pages/PlatformMatrix';
import Approvals from './pages/Approvals';
import EvidenceFactory from './pages/EvidenceFactory';
import ExportTools from './pages/ExportTools';
import ProfilesPage from './pages/ProfilesPage';
import SettingsDisclaimer from './pages/SettingsDisclaimer';

export interface RouteDef {
  path: string;
  label: string;
  icon: string;
  section: string;
  element: ComponentType;
}

export const ROUTES: RouteDef[] = [
  { path: '/', label: 'Executive Dashboard', icon: '📊', section: 'Overview', element: ExecutiveDashboard },
  { path: '/self-evaluation', label: 'Self-Evaluation Center', icon: '📝', section: 'Overview', element: SelfEvaluationCenter },
  { path: '/lens-library', label: 'Team Lens Library', icon: '📚', section: 'Overview', element: TeamLensLibrary },
  { path: '/intake', label: 'Intake Register', icon: '🗂️', section: 'Overview', element: IntakeRegister },
  { path: '/workflow', label: 'Workflow Stages', icon: '🧬', section: 'Overview', element: WorkflowStages },

  { path: '/architecture', label: 'Architecture', icon: '🏛️', section: 'Review Lenses', element: ArchitecturePage },
  { path: '/security', label: 'Security / SAR', icon: '🛡️', section: 'Review Lenses', element: SecuritySAR },
  { path: '/privacy', label: 'Privacy / PIA', icon: '🔏', section: 'Review Lenses', element: PrivacyPIA },
  { path: '/legal', label: 'Legal / OGC', icon: '⚖️', section: 'Review Lenses', element: LegalOGC },
  { path: '/data-governance', label: 'Data Governance', icon: '🗄️', section: 'Review Lenses', element: DataGovernance },
  { path: '/agent-governance', label: 'Agent Governance', icon: '🤖', section: 'Review Lenses', element: AgentGovernance },
  { path: '/secure-sdlc', label: 'Secure SDLC', icon: '🔧', section: 'Review Lenses', element: SecureSDLC },
  { path: '/platform-matrix', label: 'Platform Matrix', icon: '🧮', section: 'Review Lenses', element: PlatformMatrix },

  { path: '/approvals', label: 'Approvals', icon: '✅', section: 'Decisions & Output', element: Approvals },
  { path: '/evidence', label: 'Evidence Factory', icon: '🏭', section: 'Decisions & Output', element: EvidenceFactory },
  { path: '/export', label: 'Export & Tools', icon: '📤', section: 'Decisions & Output', element: ExportTools },
  { path: '/profiles', label: 'Profiles', icon: '👤', section: 'Decisions & Output', element: ProfilesPage },
  { path: '/settings', label: 'Settings / Disclaimer', icon: '⚙️', section: 'Decisions & Output', element: SettingsDisclaimer },
];
