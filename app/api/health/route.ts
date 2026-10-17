import { launchChecks } from '@/lib/launch/readiness';
export const dynamic = 'force-dynamic';
export async function GET() {
  const ready = Object.values(launchChecks()).every(Boolean);
  return Response.json(
    { status: ready ? 'configured' : 'preview', service: 'aegis' },
    { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
