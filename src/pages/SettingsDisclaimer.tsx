import { useWorkbenchStore } from '../store/useWorkbenchStore';
import { DISCLAIMER, APP_NAME } from '../data/constants';

export default function SettingsDisclaimer() {
  const resetAll = useWorkbenchStore((s) => s.resetAll);

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Settings & Disclaimer</h1>
        <p className="page-head__sub">About this tool, data storage, and reset options.</p>
      </div>

      <div className="card">
        <div className="card__head">
          <span className="card__title">Important disclaimer</span>
        </div>
        <div className="card__body">
          <div className="disclaimer" style={{ marginBottom: 0 }}>
            {DISCLAIMER}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <span className="card__title">About</span>
        </div>
        <div className="card__body">
          <p>
            <strong>{APP_NAME}</strong> is a self-evaluation and learning aid for preparing AI tools,
            platforms, agents, RAG apps, and connectors for enterprise review. It simulates 20
            review lenses so you can understand what each team inspects and prepare evidence before
            formal architecture, security, privacy, legal, risk, data governance, platform, support,
            finance, and go/no-go processes.
          </p>
          <p className="muted">Version 1.0.0 · Frontend-only · No data leaves your browser.</p>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <span className="card__title">Data storage</span>
        </div>
        <div className="card__body">
          <p>
            All profiles, scores, controls, evidence, notes, owners, due dates, blockers, decisions,
            and generated reports are stored locally in your browser (<span className="mono">localStorage</span>,
            key <span className="mono">ai-workbench-v1</span>). Use the Profiles page to export/import
            individual profiles as JSON.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <span className="card__title">Reset</span>
        </div>
        <div className="card__body">
          <p className="muted">
            Restore the default profiles and clear all self-assessment data. This cannot be undone.
          </p>
          <button
            className="btn btn--danger"
            onClick={() => {
              if (confirm('Reset all data to defaults? This cannot be undone.')) resetAll();
            }}
          >
            Reset all data
          </button>
        </div>
      </div>
    </div>
  );
}
