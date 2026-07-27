import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes';

export function Sidebar() {
  const sections = Array.from(new Set(ROUTES.map((r) => r.section)));

  return (
    <aside className="sidebar no-print">
      <div className="sidebar__brand">
        <svg className="sidebar__brand-mark" viewBox="0 0 32 32" aria-hidden>
          <rect width="32" height="32" rx="7" fill="#2e75b6" />
          <path
            d="M11.5 16.2l3.1 3.1 6-6.4"
            fill="none"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <div className="sidebar__brand-text">AI Onboarding</div>
          <div className="sidebar__brand-sub">Self-Evaluation Workbench</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {sections.map((section) => (
          <div key={section}>
            <div className="sidebar__section-label">{section}</div>
            {ROUTES.filter((r) => r.section === section).map((r) => (
              <NavLink key={r.path} to={r.path} end={r.path === '/'} className="nav-link">
                <span className="nav-link__icon">{r.icon}</span>
                {r.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
