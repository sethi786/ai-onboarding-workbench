import { TeamLensPage } from '../features/selfEval/TeamLensPage';

export default function AgentGovernance() {
  return (
    <TeamLensPage
      teamIds={['agent-governance', 'connector-governance']}
      title="Agent & Connector Governance"
      intro="What Agent and Connector Governance validate: ownership, autonomy, tool/action permissions, identity, human oversight, kill switches, OAuth scopes, DLP, and lifecycle."
    />
  );
}
