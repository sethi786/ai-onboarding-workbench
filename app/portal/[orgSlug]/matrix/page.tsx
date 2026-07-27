import { requireMembership } from '@/lib/auth/membership';
import { PLATFORM_MATRIX, PLATFORM_MATRIX_COLUMNS } from '@/workbench/data/platformMatrix';

export default async function MatrixPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireMembership(orgSlug);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">Platform Matrix</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Compare enterprise AI platforms across capability, identity, governance, review intensity, and cost.
      </p>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              {PLATFORM_MATRIX_COLUMNS.map((c) => (
                <th key={c.key} className="whitespace-nowrap p-2.5">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLATFORM_MATRIX.map((row) => (
              <tr key={row.platform} className="border-b border-border last:border-0 align-top">
                {PLATFORM_MATRIX_COLUMNS.map((c) => (
                  <td
                    key={c.key}
                    className={c.key === 'platform' ? 'whitespace-nowrap p-2.5 font-semibold' : 'p-2.5 text-muted-foreground'}
                  >
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
