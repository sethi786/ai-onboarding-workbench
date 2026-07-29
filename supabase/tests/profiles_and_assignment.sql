\set ON_ERROR_STOP on
truncate scim_users, scim_tokens, sso_domains, memberships, organizations, profiles cascade;
delete from auth.users;

insert into auth.users (id, email, raw_user_meta_data) values
 ('11111111-1111-1111-1111-111111111111','dana@northwind.com','{"full_name":"Dana Okafor"}'),
 ('22222222-2222-2222-2222-222222222222','sam@northwind.com','{"full_name":"Sam Reyes"}'),
 ('33333333-3333-3333-3333-333333333333','rival@contoso.com','{"full_name":"Someone Else"}');

\echo '--- T1: a profile appears automatically for every new auth user'
select count(*) as profiles_created, count(full_name) as with_names from profiles;

insert into organizations (id, slug, name, created_by) values
 ('aaaaaaaa-0000-0000-0000-000000000001','northwind','Northwind','11111111-1111-1111-1111-111111111111'),
 ('bbbbbbbb-0000-0000-0000-000000000002','contoso','Contoso','33333333-3333-3333-3333-333333333333');
insert into memberships (org_id, user_id, role) values
 ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','owner'),
 ('aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','member'),
 ('bbbbbbbb-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333333','owner');
insert into evaluations (id, org_id, name, platform, environment, created_by) values
 ('eeeeeeee-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Microsoft 365 Copilot','Microsoft','Production','11111111-1111-1111-1111-111111111111');
insert into team_assessments (org_id, evaluation_id, team_id, owner_user_id, decision) values
 ('aaaaaaaa-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','security-sar','22222222-2222-2222-2222-222222222222','Not Reviewed'),
 ('aaaaaaaa-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','privacy-pia','22222222-2222-2222-2222-222222222222','Approved'),
 ('aaaaaaaa-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','legal','11111111-1111-1111-1111-111111111111','Needs Remediation');

\echo '--- T2: Dana can see her colleague Sam by name, not by UUID'
begin;
set local role authenticated;
set local "test.uid" = '11111111-1111-1111-1111-111111111111';
select email, full_name from profiles order by email;
commit;

\echo '--- T3: CROSS-TENANT — Dana must NOT see the rival workspace user'
begin;
set local role authenticated;
set local "test.uid" = '11111111-1111-1111-1111-111111111111';
select count(*) as rival_profiles_visible from profiles where email = 'rival@contoso.com';
commit;

\echo '--- T4: Sam sees exactly the open review assigned to him (not the approved one)'
begin;
set local role authenticated;
set local "test.uid" = '22222222-2222-2222-2222-222222222222';
select org_slug, evaluation_name, team_id, decision from my_open_reviews();
commit;

\echo '--- T5: Dana sees only hers'
begin;
set local role authenticated;
set local "test.uid" = '11111111-1111-1111-1111-111111111111';
select team_id, decision from my_open_reviews();
commit;

\echo '--- T6: the rival sees nothing of Northwinds work'
begin;
set local role authenticated;
set local "test.uid" = '33333333-3333-3333-3333-333333333333';
select count(*) as rival_sees from my_open_reviews();
commit;

\echo '--- T7: losing membership removes the assignment from view'
delete from memberships where org_id='aaaaaaaa-0000-0000-0000-000000000001' and user_id='22222222-2222-2222-2222-222222222222';
begin;
set local role authenticated;
set local "test.uid" = '22222222-2222-2222-2222-222222222222';
select count(*) as after_offboarding from my_open_reviews();
commit;
