import { useNavigate } from 'react-router-dom';
import { useActiveProfile, useProfiles } from '../../hooks/useActiveProfile';
import { useWorkbenchStore } from '../../store/useWorkbenchStore';

export function ProfileSelector() {
  const profiles = useProfiles();
  const active = useActiveProfile();
  const setActive = useWorkbenchStore((s) => s.setActiveProfile);
  const navigate = useNavigate();

  return (
    <div className="row" style={{ gap: 8 }}>
      <span className="subtle" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
        Profile
      </span>
      <select
        value={active?.id ?? ''}
        onChange={(e) => {
          if (e.target.value === '__new__') {
            navigate('/profiles');
          } else {
            setActive(e.target.value);
          }
        }}
        style={{ minWidth: 240 }}
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
        <option value="__new__">+ New Profile…</option>
      </select>
    </div>
  );
}
