\set ON_ERROR_STOP off
truncate scim_users, scim_tokens, sso_domains, memberships, organizations cascade;
delete from auth.users;
insert into auth.users (id, email) values
 ('11111111-1111-1111-1111-111111111111','owner@northwind.com'),
 ('44444444-4444-4444-4444-444444444444','new1@northwind.com'),
 ('55555555-5555-5555-5555-555555555555','new2@northwind.com'),
 ('66666666-6666-6666-6666-666666666666','new3@northwind.com');
insert into organizations (id, slug, name, created_by, plan) values
 ('aaaaaaaa-0000-0000-0000-000000000001','northwind','Northwind','11111111-1111-1111-1111-111111111111','free');
insert into memberships (org_id, user_id, role) values
 ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','owner');
insert into sso_domains (org_id, domain, verified_at, default_role, require_scim) values
 ('aaaaaaaa-0000-0000-0000-000000000001','northwind.com', now(), 'member', false);
insert into scim_tokens (org_id, name, token_prefix, token_hash) values
 ('aaaaaaaa-0000-0000-0000-000000000001','okta','aeg_nw','HASH_NW');

\echo '--- free plan: 3 seats, 1 used'
select org_seat_limit('aaaaaaaa-0000-0000-0000-000000000001') as seat_limit,
       org_seats_used('aaaaaaaa-0000-0000-0000-000000000001') as used;

\echo '--- SCIM adds 2 (fills the plan)'
select scim_put_user('HASH_NW','new1@northwind.com',null,null,null,null,true,null) is not null;
select scim_put_user('HASH_NW','new2@northwind.com',null,null,null,null,true,null) is not null;
select org_seats_used('aaaaaaaa-0000-0000-0000-000000000001') as used_now;

\echo '--- SCIM adds a 4th: must be refused loudly'
select scim_put_user('HASH_NW','new3@northwind.com',null,null,null,null,true,null);
select org_seats_used('aaaaaaaa-0000-0000-0000-000000000001') as used_after_refusal;

\echo '--- SSO JIT for the same person: must not admit them either'
begin;
set local role authenticated;
set local "test.uid" = '66666666-6666-6666-6666-666666666666';
select coalesce(sso_claim_membership(), '(refused)') as sso_result;
commit;
select org_seats_used('aaaaaaaa-0000-0000-0000-000000000001') as final_seats;

\echo '--- an EXISTING member re-syncing is never blocked by the cap'
select scim_put_user('HASH_NW','new1@northwind.com',null,'Updated',null,null,true,null) is not null as existing_member_ok;

\echo '--- enterprise has no cap'
update organizations set plan='enterprise' where slug='northwind';
select scim_put_user('HASH_NW','new3@northwind.com',null,null,null,null,true,null) is not null as enterprise_ok;
select org_seats_used('aaaaaaaa-0000-0000-0000-000000000001') as enterprise_seats;
