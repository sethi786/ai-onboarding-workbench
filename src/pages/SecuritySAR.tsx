import { TeamLensPage } from '../features/selfEval/TeamLensPage';

export default function SecuritySAR() {
  return (
    <TeamLensPage
      teamIds={['security-sar']}
      title="Security / SAR"
      intro="What a Security Assessment & Review would inspect: authentication, data protection, AI-specific threats, agent controls, and incident response."
    />
  );
}
