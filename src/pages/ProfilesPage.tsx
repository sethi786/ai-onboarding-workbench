import { useRef } from 'react';
import { useActiveProfile, useProfiles } from '../hooks/useActiveProfile';
import { useWorkbenchStore, genId } from '../store/useWorkbenchStore';
import { ProfileForm } from '../features/profiles/ProfileForm';
import { EmptyState } from '../components/ui/EmptyState';
import { toProfileJson, parseProfileJson } from '../export/toJson';
import { download, slug } from '../export/download';
import type { Profile } from '../types';
import { PLATFORMS, PROJECT_TYPES } from '../data/constants';

function newProfile(): Profile {
  const now = new Date().toISOString();
  return {
    id: genId('profile'),
    name: 'New Profile',
    platform: PLATFORMS[0],
    toolType: PROJECT_TYPES[1],
    useCase: '',
    businessOwner: '',
    technicalOwner: '',
    executiveSponsor: '',
    targetUsers: '',
    dataTypes: [],
    dataClassification: 'Internal',
    environment: 'Sandbox',
    model: '',
    agentEnabled: false,
    connectorEnabled: false,
    ragEnabled: false,
    externalVendor: true,
    clientData: false,
    pii: false,
    autonomousActions: false,
    createdAt: now,
    updatedAt: now,
  };
}

export default function ProfilesPage() {
  const profile = useActiveProfile();
  const profiles = useProfiles();
  const store = useWorkbenchStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseProfileJson(text);
      store.importProfile(parsed.profile, parsed.assessments);
    } catch (e) {
      alert(`Import failed: ${(e as Error).message}`);
    }
  };

  const exportActive = () => {
    if (!profile) return;
    const json = toProfileJson(profile, (teamId) => store.getAssessment(profile.id, teamId));
    download(`${slug(profile.name)}-profile.json`, 'application/json', json);
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Profiles</h1>
        <p className="page-head__sub">
          Manage the AI tools you are self-evaluating. Each profile stores its own scores, controls,
          evidence, and decisions.
        </p>
      </div>

      <div className="btn-row no-print">
        <button className="btn btn--primary" onClick={() => store.addProfile(newProfile())}>
          + Add Profile
        </button>
        <button
          className="btn"
          disabled={!profile}
          onClick={() => profile && store.duplicateProfile(profile.id)}
        >
          Duplicate
        </button>
        <button className="btn" disabled={!profile} onClick={exportActive}>
          Export JSON
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = '';
          }}
        />
        <button
          className="btn btn--danger"
          disabled={!profile || profiles.length <= 1}
          onClick={() => {
            if (profile && confirm(`Delete profile "${profile.name}"? This cannot be undone.`)) {
              store.deleteProfile(profile.id);
            }
          }}
        >
          Delete
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '260px 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card__head">
            <span className="card__title">All profiles</span>
            <span className="acc__count">{profiles.length}</span>
          </div>
          <div className="card__body" style={{ padding: 8 }}>
            {profiles.map((p) => (
              <button
                key={p.id}
                className={`nav-link ${p.id === profile?.id ? 'active' : ''}`}
                style={{ color: p.id === profile?.id ? '#fff' : 'var(--c-text)', width: '100%' }}
                onClick={() => store.setActiveProfile(p.id)}
              >
                <span className="nav-link__icon">{p.environment === 'Production' ? '🚀' : '🧪'}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          {profile ? (
            <ProfileForm
              profile={profile}
              onChange={(patch) => store.updateProfile(profile.id, patch)}
            />
          ) : (
            <EmptyState title="No profile selected" hint="Add or pick a profile to edit." />
          )}
        </div>
      </div>
    </div>
  );
}
