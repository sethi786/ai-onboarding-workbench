import { useLocation } from 'react-router-dom';
import { ROUTES } from '../../routes';
import { ProfileSelector } from './ProfileSelector';
import { useActiveProfile } from '../../hooks/useActiveProfile';
import { useScoring } from '../../hooks/useScoring';
import { Badge } from '../ui/Badge';
import { riskTone, readinessTone } from '../ui/statusColors';

export function Header() {
  const location = useLocation();
  const profile = useActiveProfile();
  const score = useScoring(profile);
  const current = ROUTES.find((r) => r.path === location.pathname);

  return (
    <header className="header">
      <h1 className="header__title">
        {current?.icon} {current?.label ?? 'AI Onboarding Self-Evaluation Workbench'}
      </h1>
      <div className="header__spacer" />
      {score && (
        <div className="header__profile no-print">
          <div className="header__metric">
            <span>Readiness</span>
            <strong style={{ color: `var(--c-${readinessTone(score.readiness)})` }}>
              {score.readiness}
            </strong>
          </div>
          <Badge tone={riskTone(score.risk)}>{score.risk}</Badge>
        </div>
      )}
      <ProfileSelector />
    </header>
  );
}
