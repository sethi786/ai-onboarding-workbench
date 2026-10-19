import { beforeAll, beforeEach, afterEach, afterAll, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { makeDefaultWorkflow } from '../../workbench/data/workflowStages';

const owner = '00000000-0000-0000-0000-000000000001';
const member = '00000000-0000-0000-0000-000000000002';
const viewer = '00000000-0000-0000-0000-000000000003';
const outsider = '00000000-0000-0000-0000-000000000004';
const org = '10000000-0000-0000-0000-000000000001';
const otherOrg = '10000000-0000-0000-0000-000000000002';
const evaluation = '20000000-0000-0000-0000-000000000001';
const otherEval = '20000000-0000-0000-0000-000000000002';
let db: PGlite;

async function asUser(user: string) {
  await db.exec('set local role authenticated');
  await db.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
}

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key);
    create role authenticated nologin;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  `);
  const migrations = readdirSync('supabase/migrations').sort();
  for (const file of migrations.filter((f) => f < '0006')) await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
  await db.exec(`
    insert into auth.users values ('${owner}'), ('${member}'), ('${viewer}'), ('${outsider}');
    insert into organizations (id, slug, name, created_by) values ('${org}','one','One','${owner}'), ('${otherOrg}','two','Two','${owner}');
    insert into memberships (org_id, user_id, role) values ('${org}','${owner}','owner'), ('${otherOrg}','${owner}','owner'), ('${org}','${member}','member'), ('${org}','${viewer}','viewer');
    insert into evaluations (id, org_id, name, created_by) values ('${evaluation}','${org}','Legacy evaluation','${owner}'), ('${otherEval}','${org}','Other evaluation','${owner}');
    insert into team_assessments (org_id, evaluation_id, team_id, score, notes, decision) values ('${org}','${evaluation}','security-sar',5,'Preserve my work','Approved');
    insert into evidence_links (org_id, evaluation_id, team_id, label, url) values ('${org}','${evaluation}','security-sar','Legacy evidence','https://example.com');
  `);
  await db.exec(readFileSync('supabase/migrations/0006_governance_integrity.sql', 'utf8'));
  await db.exec('grant usage on schema public, auth to authenticated; grant all on all tables in schema public to authenticated; grant execute on all functions in schema public, auth to authenticated;');
}, 30000);
beforeEach(async () => { await db.exec('begin'); });
afterEach(async () => { await db.exec('rollback'); });
afterAll(async () => { await db.close(); });

describe('actual migrations, triggers, and tenant RLS', () => {
  it('preserves legacy records while requiring scope review', async () => {
    const { rows } = await db.query('select notes, score, scope_revision from team_assessments');
    expect(rows[0]).toEqual({ notes: 'Preserve my work', score: 5, scope_revision: 0 });
    const evidence = await db.query('select evidence_id, scope_revision from evidence_links');
    expect(evidence.rows[0]).toEqual({ evidence_id: '', scope_revision: 0 });
  });
  it('repairs missing workflows and atomically seeds new evaluations as a member', async () => {
    await asUser(member);
    const { rows } = await db.query<{ id: string }>('insert into evaluations (org_id, name, created_by) values ($1,$2,$3) returning id', [org, 'New', member]);
    for (const id of [evaluation, rows[0].id]) {
      const stages = await db.query<{ stage_key: string; name: string }>('select stage_key, name from workflow_stages where evaluation_id = $1 order by ordinal', [id]);
      expect(stages.rows).toEqual(makeDefaultWorkflow().map((s) => ({ stage_key: s.id, name: s.name })));
    }
  });
  it('prevents tenant moves even for an owner of both workspaces', async () => {
    await asUser(owner);
    await expect(db.query('update evaluations set org_id=$1 where id=$2', [otherOrg, evaluation])).rejects.toThrow('identity and ownership');
  });
  it('prevents moving a child to another accessible evaluation', async () => {
    await asUser(owner);
    await expect(db.query('update evidence_links set evaluation_id=$1 where evaluation_id=$2', [otherEval, evaluation])).rejects.toThrow('identity and parent');
  });
  it('rejects cross-tenant parent mismatches', async () => {
    await asUser(owner);
    await expect(db.query('insert into evidence_links (org_id, evaluation_id, team_id, url) values ($1,$2,$3,$4)', [otherOrg, evaluation, 'business', 'https://example.com'])).rejects.toThrow('org_id mismatch');
  });
  it('enforces bounded scores in the database, including direct API writes', async () => {
    await asUser(member);
    await expect(db.query('update team_assessments set score=99 where evaluation_id=$1', [evaluation])).rejects.toThrow('assessment_score_range');
  });
  it('rejects unsafe URLs in the database', async () => {
    await asUser(member);
    await expect(db.query('insert into evidence_links (org_id, evaluation_id, team_id, url) values ($1,$2,$3,$4)', [org, evaluation, 'business', 'javascript:alert(1)'])).rejects.toThrow('evidence_url_safe');
  });
  it('denies viewer mutations', async () => {
    await asUser(viewer);
    const result = await db.query('update team_assessments set notes=$1 where evaluation_id=$2 returning id', ['unauthorized', evaluation]);
    expect(result.rows).toHaveLength(0);
    await expect(db.query('insert into evidence_links (org_id, evaluation_id, team_id, url) values ($1,$2,$3,$4)', [org, evaluation, 'business', 'https://example.com'])).rejects.toThrow('row-level security');
  });
  it('denies outsiders any evaluation or evidence rows', async () => {
    await asUser(outsider);
    expect((await db.query('select * from evaluations')).rows).toHaveLength(0);
    expect((await db.query('select * from evidence_links')).rows).toHaveLength(0);
  });
  it('increments scope only for relevant changes and never trusts a submitted revision', async () => {
    await asUser(member);
    await db.query('update evaluations set name=$1, scope_revision=99 where id=$2', ['Rename only', evaluation]);
    expect((await db.query('select scope_revision from evaluations where id=$1', [evaluation])).rows[0]).toEqual({ scope_revision: 1 });
    await db.query("update evaluations set environment='Production' where id=$1", [evaluation]);
    expect((await db.query('select scope_revision from evaluations where id=$1', [evaluation])).rows[0]).toEqual({ scope_revision: 2 });
    await db.query('update team_assessments set notes=$1 where evaluation_id=$2', ['Edited but not reconfirmed', evaluation]);
    expect((await db.query('select scope_revision from team_assessments where evaluation_id=$1', [evaluation])).rows[0]).toEqual({ scope_revision: 0 });
    await db.query('update team_assessments set scope_revision=2 where evaluation_id=$1', [evaluation]);
    expect((await db.query('select scope_revision from team_assessments where evaluation_id=$1', [evaluation])).rows[0]).toEqual({ scope_revision: 2 });
  });
  it('keeps a newly saved assessment unconfirmed until explicit acknowledgement', async () => {
    await asUser(member);
    const result = await db.query('insert into team_assessments (org_id, evaluation_id, team_id, score) values ($1,$2,$3,5) returning scope_revision', [org, evaluation, 'business']);
    expect(result.rows[0]).toEqual({ scope_revision: 0 });
  });
  it('resets prior approvals on scope confirmation without clearing blocked decisions', async () => {
    await asUser(member);
    await db.query('update team_assessments set scope_revision=1 where evaluation_id=$1', [evaluation]);
    expect((await db.query('select decision from team_assessments where evaluation_id=$1', [evaluation])).rows[0]).toEqual({ decision: 'Not Reviewed' });
    await db.query("update team_assessments set decision='Blocked' where evaluation_id=$1", [evaluation]);
    await db.query("update evaluations set environment='Production' where id=$1", [evaluation]);
    await db.query('update team_assessments set scope_revision=2 where evaluation_id=$1', [evaluation]);
    expect((await db.query('select decision from team_assessments where evaluation_id=$1', [evaluation])).rows[0]).toEqual({ decision: 'Blocked' });
  });
  it('rejects stale scope acknowledgements after another profile change', async () => {
    await asUser(member);
    await db.query("update evaluations set environment='Production' where id=$1", [evaluation]);
    await expect(db.query('update team_assessments set scope_revision=1 where evaluation_id=$1', [evaluation])).rejects.toThrow('Scope changed');
  });
});
