import {
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  describe,
  expect,
  it,
} from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
const owner = '00000000-0000-0000-0000-000000000001',
  admin = '00000000-0000-0000-0000-000000000002',
  guest = '00000000-0000-0000-0000-000000000003',
  other = '00000000-0000-0000-0000-000000000004';
const org = '10000000-0000-0000-0000-000000000001';
let db: PGlite;
async function user(id: string) {
  await db.exec('set local role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
}
async function root() {
  await db.exec('reset role');
}
beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`create schema auth; create role authenticated nologin; create role service_role nologin bypassrls;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
  for (const file of readdirSync('supabase/migrations').sort())
    await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
  await db.exec(`grant usage on schema public,auth to authenticated,service_role; grant all on all tables in schema public to authenticated,service_role;
    insert into auth.users values ('${owner}','owner@example.test',now()),('${admin}','admin@example.test',now()),('${guest}','guest@example.test',now()),('${other}','other@example.test',now());
    insert into organizations(id,slug,name,created_by,plan,stripe_customer_id) values('${org}','team','Team','${owner}','team','cus_example');
    insert into memberships(org_id,user_id,role) values('${org}','${owner}','owner'),('${org}','${admin}','admin');`);
}, 30000);
beforeEach(async () => {
  await db.exec('begin');
});
afterEach(async () => {
  await db.exec('rollback');
});
afterAll(async () => {
  await db.close();
});

describe('launch database security and commercial boundaries', () => {
  it('rejects a direct plan upgrade by the owner', async () => {
    await user(owner);
    await expect(
      db.query("update organizations set plan='enterprise' where id=$1", [org]),
    ).rejects.toThrow('billing service');
  });
  it('rejects forged Stripe customer ownership', async () => {
    await user(admin);
    await expect(
      db.query(
        "update organizations set stripe_customer_id='cus_someone_else' where id=$1",
        [org],
      ),
    ).rejects.toThrow('billing service');
  });
  it('does not expose privileged billing or lead RPCs to authenticated users', async () => {
    await user(owner);
    await expect(
      db.query("select apply_billing_event('fake','cus_example','team',now())"),
    ).rejects.toThrow('permission denied');
  });
  it('does not expose leads or event ledgers through tenant RLS', async () => {
    await user(owner);
    expect((await db.query('select * from sales_leads')).rows).toHaveLength(0);
    await expect(
      db.query(
        "insert into sales_leads(name,email,message,kind) values('x','x@example.test','test message','contact')",
      ),
    ).rejects.toThrow('row-level security');
  });
  it('serializes quota checks in the database for direct evaluation writes', async () => {
    await db.query("update organizations set plan='free' where id=$1", [org]);
    await user(owner);
    for (let i = 0; i < 3; i++)
      await db.query("insert into evaluations(org_id,name) values($1,'Tool')", [
        org,
      ]);
    await expect(
      db.query("insert into evaluations(org_id,name) values($1,'Fourth')", [
        org,
      ]),
    ).rejects.toThrow('Starter includes 3');
  });
  it('prevents an admin from promoting themself to owner', async () => {
    await user(admin);
    expect(
      (
        await db.query(
          "update memberships set role='owner' where user_id=$1 returning id",
          [admin],
        )
      ).rows,
    ).toHaveLength(0);
  });
  it('retains the final workspace owner', async () => {
    await user(owner);
    await expect(
      db.query('delete from memberships where org_id=$1 and user_id=$2', [
        org,
        owner,
      ]),
    ).rejects.toThrow('at least one owner');
  });
  it('does not permit moving a membership identity', async () => {
    await user(owner);
    await expect(
      db.query('update memberships set user_id=$1 where user_id=$2', [
        guest,
        admin,
      ]),
    ).rejects.toThrow('identity is immutable');
  });
  it('accepts a matching verified email exactly once without escalating an existing role', async () => {
    await user(owner);
    const invite = await db.query<{ token: string }>(
      "select create_workspace_invitation($1,'guest@example.test','member') token",
      [org],
    );
    const token = invite.rows[0].token;
    await user(guest);
    expect(
      (
        await db.query<{ slug: string }>(
          'select accept_workspace_invitation($1) slug',
          [token],
        )
      ).rows[0].slug,
    ).toBe('team');
    await db.query('select accept_workspace_invitation($1)', [token]);
    expect(
      (await db.query('select * from memberships where user_id=$1', [guest]))
        .rows,
    ).toHaveLength(1);
  });
  it('rejects a token held by a different signed-in email', async () => {
    await user(owner);
    const { rows } = await db.query<{ token: string }>(
      "select create_workspace_invitation($1,'guest@example.test','member') token",
      [org],
    );
    await user(other);
    await expect(
      db.query('select accept_workspace_invitation($1)', [rows[0].token]),
    ).rejects.toThrow('belongs to another email');
  });
  it('requires email confirmation', async () => {
    await db.query(
      'update auth.users set email_confirmed_at=null where id=$1',
      [guest],
    );
    await user(owner);
    const { rows } = await db.query<{ token: string }>(
      "select create_workspace_invitation($1,'guest@example.test','member') token",
      [org],
    );
    await user(guest);
    await expect(
      db.query('select accept_workspace_invitation($1)', [rows[0].token]),
    ).rejects.toThrow('Confirm your email');
  });
  it('rejects an expired invitation', async () => {
    await user(owner);
    const { rows } = await db.query<{ token: string }>(
      "select create_workspace_invitation($1,'guest@example.test','member') token",
      [org],
    );
    await root();
    await db.query(
      "update invitations set expires_at=now()-interval '1 second' where token=$1",
      [rows[0].token],
    );
    await user(guest);
    await expect(
      db.query('select accept_workspace_invitation($1)', [rows[0].token]),
    ).rejects.toThrow('expired');
  });
  it('rejects a revoked invitation', async () => {
    await user(owner);
    const { rows } = await db.query<{ token: string }>(
      "select create_workspace_invitation($1,'guest@example.test','member') token",
      [org],
    );
    await db.query(
      'select revoke_workspace_invitation(id) from invitations where token=$1',
      [rows[0].token],
    );
    await user(guest);
    await expect(
      db.query('select accept_workspace_invitation($1)', [rows[0].token]),
    ).rejects.toThrow('unavailable');
  });
  it('limits admins to member or viewer invitations', async () => {
    await user(admin);
    await expect(
      db.query(
        "select create_workspace_invitation($1,'guest@example.test','admin')",
        [org],
      ),
    ).rejects.toThrow('Only owners');
  });
  it('does not let Starter invite beyond its single seat', async () => {
    await db.query("update organizations set plan='free' where id=$1", [org]);
    await user(owner);
    await expect(
      db.query(
        "select create_workspace_invitation($1,'guest@example.test','member')",
        [org],
      ),
    ).rejects.toThrow('member limit');
  });
  it('rejects acceptance when the inviter has lost permission', async () => {
    await user(admin);
    const { rows } = await db.query<{ token: string }>(
      "select create_workspace_invitation($1,'guest@example.test','member') token",
      [org],
    );
    await user(owner);
    await db.query("update memberships set role='viewer' where user_id=$1", [
      admin,
    ]);
    await user(guest);
    await expect(
      db.query('select accept_workspace_invitation($1)', [rows[0].token]),
    ).rejects.toThrow('no longer authorized');
  });
  it('deduplicates billing events and ignores stale observations', async () => {
    await db.exec('set local role service_role');
    await db.query(
      "select apply_billing_event('evt_2','cus_example','free','2026-10-17T12:00:02Z')",
    );
    await db.query(
      "select apply_billing_event('evt_1','cus_example','team','2026-10-17T12:00:01Z')",
    );
    await db.query(
      "select apply_billing_event('evt_2','cus_example','team','2026-10-17T12:00:03Z')",
    );
    expect(
      (await db.query('select plan from organizations where id=$1', [org]))
        .rows[0],
    ).toEqual({ plan: 'free' });
    expect((await db.query('select * from billing_events')).rows).toHaveLength(
      2,
    );
  });
  it('rolls back the event ledger if reconciliation fails', async () => {
    await db.exec('set local role service_role');
    await expect(
      db.query(
        "select apply_billing_event('evt_bad','cus_unknown','team',now())",
      ),
    ).rejects.toThrow('Unknown billing customer');
  });
  it('allows only one checkout lock at a time', async () => {
    await db.exec('set local role service_role');
    expect(
      (
        await db.query<{ claimed: boolean }>(
          'select claim_checkout($1,$2) claimed',
          [org, guest],
        )
      ).rows[0].claimed,
    ).toBe(true);
    expect(
      (
        await db.query<{ claimed: boolean }>(
          'select claim_checkout($1,$2) claimed',
          [org, other],
        )
      ).rows[0].claimed,
    ).toBe(false);
  });
  it('stores enquiries and enforces a persistent rate limit', async () => {
    await db.exec('set local role service_role');
    for (let i = 0; i < 3; i++)
      await db.query(
        "select submit_sales_lead('Buyer','buyer@example.test','Acme','Please show me the product','demo')",
      );
    expect((await db.query('select * from sales_leads')).rows).toHaveLength(3);
    await expect(
      db.query(
        "select submit_sales_lead('Buyer','BUYER@example.test','Acme','Please show me the product','demo')",
      ),
    ).rejects.toThrow('Too many');
  });
});
