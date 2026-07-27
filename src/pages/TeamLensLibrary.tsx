import { useState } from 'react';
import { TEAM_LENSES } from '../data/teamLenses';
import { Accordion } from '../components/ui/Accordion';
import { Badge } from '../components/ui/Badge';

export default function TeamLensLibrary() {
  const [query, setQuery] = useState('');
  const lenses = TEAM_LENSES.filter((l) =>
    l.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Team Lens Library</h1>
        <p className="page-head__sub">
          Reference control packs for all 20 review lenses — what each team inspects, the controls
          they validate, the evidence they require, and what blocks approval. Read-only reference.
        </p>
      </div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search lenses…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="stack">
        {lenses.map((lens) => (
          <div className="card" key={lens.id}>
            <div className="card__head">
              <span style={{ fontSize: 18 }}>{lens.icon}</span>
              <span className="card__title">{lens.title}</span>
              {lens.alwaysRequired ? (
                <Badge tone="blue">Always required</Badge>
              ) : (
                <Badge tone="gray">Conditional</Badge>
              )}
              <span className="acc__count" style={{ marginLeft: 'auto' }}>
                weight ×{lens.weight}
              </span>
            </div>
            <div className="card__body stack">
              <p className="muted">{lens.reviewPurpose}</p>
              <div className="chip-list">
                {lens.scope.map((s) => (
                  <span className="tag" key={s}>
                    {s}
                  </span>
                ))}
              </div>
              <div className="grid grid--2">
                <Accordion title="Detailed review checklist" count={lens.checklist.length}>
                  <ul>
                    {lens.checklist.map((c) => (
                      <li key={c.id}>{c.text}</li>
                    ))}
                  </ul>
                </Accordion>
                <Accordion title="Required controls" count={lens.requiredControls.length}>
                  <ul>
                    {lens.requiredControls.map((c) => (
                      <li key={c.id}>
                        {c.label}
                        {c.critical && (
                          <span className="tag badge--red" style={{ marginLeft: 6 }}>
                            critical
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Accordion>
                <Accordion title="Evidence required" count={lens.evidenceRequired.length}>
                  <ul>
                    {lens.evidenceRequired.map((e) => (
                      <li key={e.id}>{e.label}</li>
                    ))}
                  </ul>
                </Accordion>
                <Accordion title="Blockers / No-Go" count={lens.blockers.length}>
                  <ul>
                    {lens.blockers.map((b) => (
                      <li key={b.id}>
                        {b.label}
                        {b.critical && (
                          <span className="tag badge--red" style={{ marginLeft: 6 }}>
                            critical
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Accordion>
                <Accordion title="Pass criteria" count={lens.passCriteria.length}>
                  <ul>
                    {lens.passCriteria.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </Accordion>
                <Accordion title="Conditional approval" count={lens.conditionalApproval.length}>
                  <ul>
                    {lens.conditionalApproval.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </Accordion>
                <Accordion title="Common findings" count={lens.commonFindings.length}>
                  <ul>
                    {lens.commonFindings.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </Accordion>
                <Accordion title="Remediation" count={lens.remediation.length}>
                  <ul>
                    {lens.remediation.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </Accordion>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
