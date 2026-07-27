import { TeamLensPage } from '../features/selfEval/TeamLensPage';

export default function PrivacyPIA() {
  return (
    <TeamLensPage
      teamIds={['privacy-pia']}
      title="Privacy / PIA"
      intro="What a Privacy Impact Assessment examines: personal data, minimization, residency, retention, deletion rights, and subprocessors."
    />
  );
}
