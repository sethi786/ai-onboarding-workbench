import { createHash, randomBytes } from 'node:crypto';

/**
 * SCIM 2.0 wire format — RFC 7643 (schema) and RFC 7644 (protocol).
 *
 * Kept pure and separate from the route handlers so the parts most likely to
 * be got wrong can be tested directly. Identity providers are unforgiving
 * clients: Entra disables a provisioning job outright after repeated
 * non-conforming responses, and neither it nor Okta will tell you which field
 * it disliked. The shapes below are what those two actually send and expect.
 */

export const SCIM_CONTENT_TYPE = 'application/scim+json; charset=utf-8';

const USER_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:User';
const LIST_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';
const ERROR_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:Error';
const PATCH_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';

/** A provisioned user as stored by us. */
export interface ScimUserRow {
  id: string;
  external_id: string | null;
  user_name: string;
  given_name: string | null;
  family_name: string | null;
  display_name: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ tokens */

/** `aeg_scim_` prefix so a leaked token is recognisable in a log or a repo. */
export function generateScimToken(): { token: string; prefix: string; hash: string } {
  const token = `aeg_scim_${randomBytes(32).toString('base64url')}`;
  return { token, prefix: token.slice(0, 16), hash: hashScimToken(token) };
}

/**
 * Tokens are stored as a hash and looked up by it, never compared.
 * A database leak therefore yields nothing presentable to the API.
 */
export function hashScimToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Pull the bearer credential out of an Authorization header. */
export function bearerFrom(header: string | null): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m ? m[1].trim() : null;
}

/* --------------------------------------------------------------- resources */

export function toScimUser(row: ScimUserRow, baseUrl: string): Record<string, unknown> {
  const formatted =
    row.display_name ??
    ([row.given_name, row.family_name].filter(Boolean).join(' ') || row.user_name);

  return {
    schemas: [USER_SCHEMA],
    id: row.id,
    externalId: row.external_id ?? undefined,
    userName: row.user_name,
    name: {
      givenName: row.given_name ?? undefined,
      familyName: row.family_name ?? undefined,
      formatted,
    },
    displayName: formatted,
    // Entra matches on the primary work email, and omitting it makes every
    // user look new on the next sync.
    emails: [{ value: row.user_name, type: 'work', primary: true }],
    active: row.active,
    meta: {
      resourceType: 'User',
      created: row.created_at,
      lastModified: row.updated_at,
      location: `${baseUrl}/Users/${row.id}`,
    },
  };
}

export function listResponse(
  resources: Record<string, unknown>[],
  totalResults: number,
  startIndex: number,
): Record<string, unknown> {
  return {
    schemas: [LIST_SCHEMA],
    totalResults,
    startIndex,
    itemsPerPage: resources.length,
    Resources: resources,
  };
}

export function scimError(status: number, detail: string, scimType?: string) {
  return {
    body: {
      schemas: [ERROR_SCHEMA],
      status: String(status),
      ...(scimType ? { scimType } : {}),
      detail,
    },
    status,
  };
}

/* ----------------------------------------------------------------- filters */

/**
 * The subset of the filter grammar provisioning actually uses.
 *
 * RFC 7644 defines a full expression language, but during provisioning Okta
 * and Entra both send exactly `userName eq "someone@example.com"` to check
 * whether a user already exists. Anything else returns undefined and the
 * caller lists unfiltered rather than erroring — an IdP cannot act on a
 * "filter unsupported" response, and a slightly over-broad page is recoverable
 * where a failed sync job is not.
 */
export function parseUserNameFilter(filter: string | null): string | undefined {
  if (!filter) return undefined;
  const m = /^\s*userName\s+eq\s+"([^"]*)"\s*$/i.exec(filter);
  return m ? m[1] : undefined;
}

/* ------------------------------------------------------------------ PATCH */

export interface PatchResult {
  active?: boolean;
  givenName?: string | null;
  familyName?: string | null;
  displayName?: string | null;
  userName?: string;
  externalId?: string | null;
}

interface PatchOperation {
  op?: string;
  path?: string;
  value?: unknown;
}

/**
 * Reduce a PatchOp body to the fields we store.
 *
 * Deactivation is the operation that matters and it arrives in three different
 * shapes in the wild: `path: "active"` with a boolean, the same with the string
 * "False" (Entra sends a capitalised string), and a pathless replace carrying
 * an object of attributes. All three are handled, because getting deactivation
 * wrong means an offboarded employee keeps their access.
 */
export function applyPatch(body: unknown): PatchResult {
  const out: PatchResult = {};
  const doc = body as { schemas?: unknown; Operations?: PatchOperation[] } | null;
  if (!doc || !Array.isArray(doc.Operations)) return out;

  const bool = (v: unknown): boolean | undefined => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
      if (/^true$/i.test(v)) return true;
      if (/^false$/i.test(v)) return false;
    }
    return undefined;
  };

  const assign = (key: string, value: unknown) => {
    switch (key.toLowerCase().replace(/^urn:[^:]*:.*:/, '')) {
      case 'active': {
        const b = bool(value);
        if (b !== undefined) out.active = b;
        break;
      }
      case 'username':
        if (typeof value === 'string' && value) out.userName = value;
        break;
      case 'externalid':
        if (typeof value === 'string') out.externalId = value;
        break;
      case 'displayname':
        if (typeof value === 'string') out.displayName = value;
        break;
      case 'name.givenname':
        if (typeof value === 'string') out.givenName = value;
        break;
      case 'name.familyname':
        if (typeof value === 'string') out.familyName = value;
        break;
      case 'name':
        if (value && typeof value === 'object') {
          const n = value as Record<string, unknown>;
          if (typeof n.givenName === 'string') out.givenName = n.givenName;
          if (typeof n.familyName === 'string') out.familyName = n.familyName;
        }
        break;
      default:
        break;
    }
  };

  for (const op of doc.Operations) {
    const verb = (op.op ?? '').toLowerCase();
    // "remove" on `active` is how some clients express deactivation.
    if (verb === 'remove' && op.path && /active/i.test(op.path)) {
      out.active = false;
      continue;
    }
    if (verb !== 'add' && verb !== 'replace') continue;

    if (op.path) {
      assign(op.path, op.value);
      continue;
    }
    // Pathless: the value is an object of attributes to merge.
    if (op.value && typeof op.value === 'object') {
      for (const [k, v] of Object.entries(op.value as Record<string, unknown>)) assign(k, v);
    }
  }
  return out;
}

/* ----------------------------------------------------------- provider meta */

export function serviceProviderConfig(baseUrl: string) {
  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
    documentationUri: `${baseUrl.replace(/\/scim\/v2$/, '')}/docs/scim`,
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 500 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        type: 'oauthbearertoken',
        name: 'OAuth Bearer Token',
        description: 'Long-lived bearer token issued in Aegis workspace settings.',
        primary: true,
      },
    ],
    meta: { resourceType: 'ServiceProviderConfig', location: `${baseUrl}/ServiceProviderConfig` },
  };
}

export function resourceTypes(baseUrl: string) {
  return listResponse(
    [
      {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'],
        id: 'User',
        name: 'User',
        endpoint: '/Users',
        description: 'User Account',
        schema: USER_SCHEMA,
        meta: { resourceType: 'ResourceType', location: `${baseUrl}/ResourceTypes/User` },
      },
    ],
    1,
    1,
  );
}

export function schemas() {
  return listResponse(
    [
      {
        id: USER_SCHEMA,
        name: 'User',
        description: 'User Account',
        attributes: [
          {
            name: 'userName',
            type: 'string',
            multiValued: false,
            required: true,
            caseExact: false,
            mutability: 'readWrite',
            returned: 'default',
            uniqueness: 'server',
          },
          {
            name: 'active',
            type: 'boolean',
            multiValued: false,
            required: false,
            mutability: 'readWrite',
            returned: 'default',
          },
        ],
        meta: { resourceType: 'Schema' },
      },
    ],
    1,
    1,
  );
}

export { USER_SCHEMA, PATCH_SCHEMA };
