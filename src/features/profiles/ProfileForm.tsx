import type { Profile } from '../../types';
import { Field } from '../../components/ui/Field';
import {
  PLATFORMS,
  PROJECT_TYPES,
  DATA_CLASSIFICATIONS,
  ENVIRONMENTS,
  DATA_TYPE_OPTIONS,
} from '../../data/constants';

interface Props {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
}

const FLAGS: { key: keyof Profile; label: string }[] = [
  { key: 'agentEnabled', label: 'Agent enabled' },
  { key: 'connectorEnabled', label: 'Connector enabled' },
  { key: 'ragEnabled', label: 'RAG enabled' },
  { key: 'externalVendor', label: 'External vendor' },
  { key: 'clientData', label: 'Client data involved' },
  { key: 'pii', label: 'PII involved' },
  { key: 'autonomousActions', label: 'Autonomous actions' },
];

export function ProfileForm({ profile, onChange }: Props) {
  const toggleDataType = (dt: string) => {
    const has = profile.dataTypes.includes(dt);
    onChange({
      dataTypes: has
        ? profile.dataTypes.filter((x) => x !== dt)
        : [...profile.dataTypes, dt],
    });
  };

  return (
    <div className="stack">
      <fieldset>
        <legend>Identity</legend>
        <div className="form-grid">
          <Field label="Profile name">
            <input value={profile.name} onChange={(e) => onChange({ name: e.target.value })} />
          </Field>
          <Field label="Platform">
            <select value={profile.platform} onChange={(e) => onChange({ platform: e.target.value })}>
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Tool / project type">
            <select
              value={profile.toolType}
              onChange={(e) => onChange({ toolType: e.target.value as Profile['toolType'] })}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Model used">
            <input value={profile.model} onChange={(e) => onChange({ model: e.target.value })} />
          </Field>
        </div>
        <Field label="Use case description">
          <textarea value={profile.useCase} onChange={(e) => onChange({ useCase: e.target.value })} />
        </Field>
      </fieldset>

      <fieldset>
        <legend>Ownership</legend>
        <div className="form-grid">
          <Field label="Business owner">
            <input
              value={profile.businessOwner}
              onChange={(e) => onChange({ businessOwner: e.target.value })}
            />
          </Field>
          <Field label="Technical owner">
            <input
              value={profile.technicalOwner}
              onChange={(e) => onChange({ technicalOwner: e.target.value })}
            />
          </Field>
          <Field label="Executive sponsor">
            <input
              value={profile.executiveSponsor}
              onChange={(e) => onChange({ executiveSponsor: e.target.value })}
            />
          </Field>
          <Field label="Target users">
            <input
              value={profile.targetUsers}
              onChange={(e) => onChange({ targetUsers: e.target.value })}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend>Data & Environment</legend>
        <div className="form-grid">
          <Field label="Data classification">
            <select
              value={profile.dataClassification}
              onChange={(e) =>
                onChange({ dataClassification: e.target.value as Profile['dataClassification'] })
              }
            >
              {DATA_CLASSIFICATIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Environment">
            <select
              value={profile.environment}
              onChange={(e) => onChange({ environment: e.target.value as Profile['environment'] })}
            >
              {ENVIRONMENTS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Data types" hint="Select all that apply.">
          <div className="chip-list" style={{ marginTop: 4 }}>
            {DATA_TYPE_OPTIONS.map((dt) => (
              <label
                key={dt}
                className={`tag ${profile.dataTypes.includes(dt) ? 'badge--blue' : ''}`}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <input
                  type="checkbox"
                  style={{ width: 'auto', marginRight: 5 }}
                  checked={profile.dataTypes.includes(dt)}
                  onChange={() => toggleDataType(dt)}
                />
                {dt}
              </label>
            ))}
          </div>
        </Field>
      </fieldset>

      <fieldset>
        <legend>Capability flags (drive review intensity)</legend>
        <div className="form-grid">
          {FLAGS.map((f) => (
            <label className="checkbox" key={String(f.key)}>
              <input
                type="checkbox"
                checked={Boolean(profile[f.key])}
                onChange={(e) => onChange({ [f.key]: e.target.checked } as Partial<Profile>)}
              />
              {f.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
