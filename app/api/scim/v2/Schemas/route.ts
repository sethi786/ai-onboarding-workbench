import { schemas } from '@/lib/scim/protocol';
import { scimJson, withScim } from '@/lib/scim/handler';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withScim(request, async () => scimJson(schemas()));
}
