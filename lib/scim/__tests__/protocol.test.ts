import { describe, it, expect } from 'vitest';
import {
  applyPatch,
  bearerFrom,
  generateScimToken,
  hashScimToken,
  listResponse,
  parseUserNameFilter,
  scimError,
  serviceProviderConfig,
  toScimUser,
} from '../protocol';

const row = {
  id: '9c1f0f1e-0000-4000-8000-000000000001',
  external_id: 'okta-42',
  user_name: 'jo@northwind.com',
  given_name: 'Jo',
  family_name: 'Bloggs',
  display_name: null,
  active: true,
  created_at: '2026-07-01T09:00:00Z',
  updated_at: '2026-07-02T09:00:00Z',
};

describe('scim tokens', () => {
  it('hashes rather than stores, and the hash is stable', () => {
    const { token, hash, prefix } = generateScimToken();
    expect(token.startsWith('aeg_scim_')).toBe(true);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(token);
    expect(hashScimToken(token)).toBe(hash);
    expect(token.startsWith(prefix)).toBe(true);
  });

  it('does not collide across generations', () => {
    const a = generateScimToken();
    const b = generateScimToken();
    expect(a.token).not.toBe(b.token);
    expect(a.hash).not.toBe(b.hash);
  });

  it('reads a bearer credential and rejects anything else', () => {
    expect(bearerFrom('Bearer abc123')).toBe('abc123');
    expect(bearerFrom('bearer   abc123  ')).toBe('abc123');
    expect(bearerFrom('Basic abc123')).toBeNull();
    expect(bearerFrom(null)).toBeNull();
    expect(bearerFrom('')).toBeNull();
  });
});

describe('user representation', () => {
  it('carries the fields identity providers match on', () => {
    const u = toScimUser(row, 'https://aegis.example/scim/v2');
    expect(u.id).toBe(row.id);
    expect(u.userName).toBe('jo@northwind.com');
    expect(u.externalId).toBe('okta-42');
    expect(u.active).toBe(true);
    // Entra matches on the primary work email; omitting it makes every user
    // look new on the next sync.
    expect(u.emails).toEqual([{ value: 'jo@northwind.com', type: 'work', primary: true }]);
    expect((u.meta as Record<string, string>).location).toBe(
      'https://aegis.example/scim/v2/Users/' + row.id,
    );
  });

  it('falls back to the name parts when no display name is set', () => {
    expect(toScimUser(row, 'x').displayName).toBe('Jo Bloggs');
    expect(toScimUser({ ...row, given_name: null, family_name: null }, 'x').displayName).toBe(
      'jo@northwind.com',
    );
  });
});

describe('list and error envelopes', () => {
  it('uses the ListResponse schema with 1-based paging', () => {
    const r = listResponse([{ id: 'a' }], 7, 1);
    expect(r.schemas).toEqual(['urn:ietf:params:scim:api:messages:2.0:ListResponse']);
    expect(r.totalResults).toBe(7);
    expect(r.startIndex).toBe(1);
    expect(r.itemsPerPage).toBe(1);
  });

  it('reports error status as a string, as the spec requires', () => {
    const e = scimError(409, 'already exists', 'uniqueness');
    expect(e.status).toBe(409);
    expect(e.body.status).toBe('409');
    expect(e.body.scimType).toBe('uniqueness');
  });

  it('advertises patch and filter support', () => {
    const c = serviceProviderConfig('https://aegis.example/scim/v2');
    expect(c.patch.supported).toBe(true);
    expect(c.filter.supported).toBe(true);
    expect(c.bulk.supported).toBe(false);
  });
});

describe('filters', () => {
  it('reads the equality filter provisioning actually sends', () => {
    expect(parseUserNameFilter('userName eq "jo@northwind.com"')).toBe('jo@northwind.com');
    expect(parseUserNameFilter('  userName   eq   "a@b.c"  ')).toBe('a@b.c');
    expect(parseUserNameFilter('USERNAME EQ "a@b.c"')).toBe('a@b.c');
  });

  it('returns undefined rather than failing on anything else', () => {
    // An IdP cannot act on "filter unsupported"; listing unfiltered is
    // recoverable, a dead provisioning job is not.
    expect(parseUserNameFilter('active eq true')).toBeUndefined();
    expect(parseUserNameFilter(null)).toBeUndefined();
    expect(parseUserNameFilter('userName sw "jo"')).toBeUndefined();
  });
});

describe('patch', () => {
  it('deactivates from a boolean value', () => {
    expect(
      applyPatch({ Operations: [{ op: 'replace', path: 'active', value: false }] }).active,
    ).toBe(false);
  });

  it('deactivates from the capitalised string Entra sends', () => {
    expect(
      applyPatch({ Operations: [{ op: 'Replace', path: 'active', value: 'False' }] }).active,
    ).toBe(false);
  });

  it('deactivates from a pathless replace carrying an object', () => {
    expect(applyPatch({ Operations: [{ op: 'replace', value: { active: false } }] }).active).toBe(
      false,
    );
  });

  it('treats removing active as deactivation', () => {
    expect(applyPatch({ Operations: [{ op: 'remove', path: 'active' }] }).active).toBe(false);
  });

  it('reactivates', () => {
    expect(applyPatch({ Operations: [{ op: 'replace', path: 'active', value: true }] }).active).toBe(
      true,
    );
  });

  it('updates names by path and by nested object', () => {
    expect(
      applyPatch({ Operations: [{ op: 'replace', path: 'name.givenName', value: 'Jo' }] }).givenName,
    ).toBe('Jo');
    expect(
      applyPatch({
        Operations: [{ op: 'replace', path: 'name', value: { givenName: 'A', familyName: 'B' } }],
      }),
    ).toMatchObject({ givenName: 'A', familyName: 'B' });
  });

  it('ignores operations it does not understand instead of throwing', () => {
    expect(applyPatch({ Operations: [{ op: 'replace', path: 'nickName', value: 'x' }] })).toEqual({});
    expect(applyPatch({})).toEqual({});
    expect(applyPatch(null)).toEqual({});
    expect(applyPatch({ Operations: 'nonsense' })).toEqual({});
  });

  it('does not invent a value from a malformed active', () => {
    expect(
      applyPatch({ Operations: [{ op: 'replace', path: 'active', value: 'yes' }] }).active,
    ).toBeUndefined();
  });
});
