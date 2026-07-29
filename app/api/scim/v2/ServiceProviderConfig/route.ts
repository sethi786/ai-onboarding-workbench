import { serviceProviderConfig } from '@/lib/scim/protocol';
import { scimBaseUrl, scimJson, withScim } from '@/lib/scim/handler';

export const dynamic = 'force-dynamic';

/** Discovery. Both providers call this first to learn what we support. */
export async function GET(request: Request) {
  return withScim(request, async () => scimJson(serviceProviderConfig(scimBaseUrl(request))));
}
