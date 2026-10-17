import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
let db: PGlite;
const owner = '00000000-0000-4000-8000-000000000001';
const outsider = '00000000-0000-4000-8000-000000000002';
let org: string;
async function asUser(id: string) {
  await db.exec('set local role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
}
beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`create schema auth; create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated,service_role;`);
  // No blanket public table/function grants: the migrations must supply them.
  for (const file of readdirSync('supabase/migrations').sort())
    await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
  await db.query(
    "insert into auth.users values($1,'owner@example.test',now()),($2,'outsider@example.test',now())",
    [owner, outsider],
  );
}, 30000);
beforeEach(async () => {
  await db.exec('begin');
  await asUser(owner);
  org = (
    await db.query<{ id: string }>(
      "select create_organization('Test company','test-company') id",
    )
  ).rows[0].id;
});
afterEach(async () => {
  await db.exec('rollback');
});
afterAll(async () => {
  await db.close();
});
it('creates a workspace and owner membership using only installed privileges', async () => {
  expect((await db.query('select name from organizations')).rows).toEqual([
    { name: 'Test company' },
  ]);
  expect((await db.query('select role from memberships')).rows).toEqual([
    { role: 'owner' },
  ]);
});
it('persists an assessment, atomic workflow and activity with real installed grants', async () => {
  const evaluation = (
    await db.query<{ id: string }>(
      "insert into evaluations(org_id,name) values($1,'First review') returning id",
      [org],
    )
  ).rows[0].id;
  await db.query(
    "insert into team_assessments(org_id,evaluation_id,team_id,score) values($1,$2,'security-sar',2)",
    [org, evaluation],
  );
  await db.query(
    "update team_assessments set notes='Saved evidence review' where evaluation_id=$1",
    [evaluation],
  );
  expect((await db.query('select notes from team_assessments')).rows).toEqual([
    { notes: 'Saved evidence review' },
  ]);
  expect((await db.query('select * from workflow_stages')).rows).toHaveLength(
    25,
  );
  expect(
    (await db.query('select * from workspace_activity')).rows.length,
  ).toBeGreaterThan(2);
});
it('keeps workspace contents invisible to another authenticated customer', async () => {
  await db.query(
    "insert into evaluations(org_id,name) values($1,'Private review')",
    [org],
  );
  await asUser(outsider);
  for (const table of [
    'organizations',
    'memberships',
    'evaluations',
    'workspace_activity',
  ])
    expect((await db.query(`select * from ${table}`)).rows).toHaveLength(0);
});
it('does not allow the authenticated role to truncate tenant data or forge activity', async () => {
  const privileges = await db.query<{
    truncate: boolean;
    write_history: boolean;
  }>(
    "select has_table_privilege('authenticated','evaluations','TRUNCATE') as truncate, has_table_privilege('authenticated','workspace_activity','INSERT') as write_history",
  );
  expect(privileges.rows[0]).toEqual({ truncate: false, write_history: false });
  await expect(db.exec('truncate evaluations cascade')).rejects.toThrow(
    'permission denied',
  );
});
it('keeps anonymous visitors away from tables and privileged setup RPCs', async () => {
  expect(
    (
      await db.query(
        "select has_table_privilege('anon','evaluations','SELECT') allowed",
      )
    ).rows,
  ).toEqual([{ allowed: false }]);
  expect(
    (
      await db.query(
        "select has_function_privilege('anon','create_organization(text,text)','EXECUTE') allowed",
      )
    ).rows,
  ).toEqual([{ allowed: false }]);
});
it('requires validated invitation RPCs and service-only billing/lead operations', async () => {
  expect(
    (
      await db.query(
        "select has_table_privilege('authenticated','invitations','INSERT') allowed",
      )
    ).rows,
  ).toEqual([{ allowed: false }]);
  expect(
    (
      await db.query(
        "select has_function_privilege('authenticated','create_workspace_invitation(uuid,text,org_role)','EXECUTE') allowed",
      )
    ).rows,
  ).toEqual([{ allowed: true }]);
  expect(
    (
      await db.query(
        "select has_function_privilege('authenticated','apply_billing_event(text,text,text,timestamptz)','EXECUTE') allowed",
      )
    ).rows,
  ).toEqual([{ allowed: false }]);
  expect(
    (
      await db.query(
        "select has_table_privilege('authenticated','sales_leads','SELECT') allowed",
      )
    ).rows,
  ).toEqual([{ allowed: false }]);
  await db.exec('reset role; set local role service_role');
  expect(
    (
      await db.query(
        "select submit_sales_lead('Test buyer','buyer@example.test','Example','A useful test enquiry','contact') id",
      )
    ).rows[0],
  ).toHaveProperty('id');
});
