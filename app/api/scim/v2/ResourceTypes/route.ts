import { resourceTypes } from '@/lib/scim/protocol';
import { scimBaseUrl, scimJson, withScim } from '@/lib/scim/handler';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withScim(request, async () => scimJson(resourceTypes(scimBaseUrl(request))));
}
