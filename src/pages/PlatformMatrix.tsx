import { PLATFORM_MATRIX, PLATFORM_MATRIX_COLUMNS } from '../data/platformMatrix';

export default function PlatformMatrix() {
  return (
    <div className="stack">
      <div className="page-head">
        <h1>Platform Matrix</h1>
        <p className="page-head__sub">
          Compare enterprise AI platforms across capability, identity, governance, review intensity,
          and cost — to inform build-vs-buy and platform-fit decisions.
        </p>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {PLATFORM_MATRIX_COLUMNS.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLATFORM_MATRIX.map((row) => (
              <tr key={row.platform}>
                {PLATFORM_MATRIX_COLUMNS.map((c) => (
                  <td key={c.key} style={c.key === 'platform' ? { fontWeight: 600, whiteSpace: 'nowrap' } : undefined}>
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
