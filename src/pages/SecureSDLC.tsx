import { TeamLensPage } from '../features/selfEval/TeamLensPage';

export default function SecureSDLC() {
  return (
    <TeamLensPage
      teamIds={['secure-sdlc', 'ai-engineering']}
      title="DevSecOps / Secure SDLC & AI Engineering"
      intro="What Secure SDLC and AI Engineering validate: CI/CD, scanning, testing, prompt/model versioning, rollback, evaluation, observability, and token/cost."
    />
  );
}
