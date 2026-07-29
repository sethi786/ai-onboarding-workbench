\set ON_ERROR_STOP on
-- two tenants, two admins, two SCIM tokens
insert into auth.users (id, email) values
 ('11111111-1111-1111-1111-111111111111','admin@northwind.com'),
 ('22222222-2222-2222-2222-222222222222','admin@contoso.com'),
 ('33333333-3333-3333-3333-333333333333','jo@northwind.com')
on conflict do nothing;

begin;
set local role postgres;
insert into organizations (id, slug, name, created_by) values
 ('aaaaaaaa-0000-0000-0000-000000000001','northwind','Northwind','11111111-1111-1111-1111-111111111111'),
 ('bbbbbbbb-0000-0000-0000-000000000002','contoso','Contoso','22222222-2222-2222-2222-222222222222');
insert into memberships (org_id, user_id, role) values
 ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','owner'),
 ('bbbbbbbb-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','owner');
insert into sso_domains (org_id, domain, verified_at, default_role, require_scim) values
 ('aaaaaaaa-0000-0000-0000-000000000001','northwind.com', now(), 'member', true);
insert into scim_tokens (org_id, name, token_prefix, token_hash) values
 ('aaaaaaaa-0000-0000-0000-000000000001','okta','aeg_nw','HASH_NORTHWIND'),
 ('bbbbbbbb-0000-0000-0000-000000000002','okta','aeg_co','HASH_CONTOSO');
commit;

\echo '--- T1: token resolves to its own org only'
select (scim_org_for_token('HASH_NORTHWIND') = 'aaaaaaaa-0000-0000-0000-000000000001') as northwind_ok,
       (scim_org_for_token('HASH_CONTOSO')   = 'bbbbbbbb-0000-0000-0000-000000000002') as contoso_ok,
       (scim_org_for_token('GARBAGE') is null) as garbage_rejected;

\echo '--- T2: provision a user via SCIM'
select user_name, active, role from scim_put_user('HASH_NORTHWIND','jo@northwind.com','okta-1','Jo','Bloggs','Jo Bloggs',true,null);

\echo '--- T3: membership created because the auth user already exists'
select count(*) as jo_memberships from memberships
where org_id='aaaaaaaa-0000-0000-0000-000000000001' and user_id='33333333-3333-3333-3333-333333333333';

\echo '--- T4: CROSS-TENANT — Contoso token must not see or touch Northwind users'
select count(*) as contoso_sees_northwind from scim_list_users('HASH_CONTOSO', 'jo@northwind.com');
select (scim_get_user('HASH_CONTOSO', (select id from scim_users where user_name='jo@northwind.com'))).id
   as contoso_read_of_northwind_row;
select scim_delete_user('HASH_CONTOSO', (select id from scim_users where user_name='jo@northwind.com'))
   as contoso_delete_of_northwind_row;
select count(*) as jo_still_there from scim_users where user_name='jo@northwind.com';

\echo '--- T5: deactivation removes access'
select active from scim_set_active('HASH_NORTHWIND', (select id from scim_users where user_name='jo@northwind.com'), false);
select count(*) as jo_memberships_after_offboard from memberships
where org_id='aaaaaaaa-0000-0000-0000-000000000001' and user_id='33333333-3333-3333-3333-333333333333';

\echo '--- T6: last owner cannot be removed by a directory mistake'
select scim_put_user('HASH_NORTHWIND','admin@northwind.com','okta-2','A','D','Admin',true,null) is not null as owner_provisioned;
select scim_set_active('HASH_NORTHWIND',(select id from scim_users where user_name='admin@northwind.com'), false) is not null as owner_deactivated;
select count(*) as owners_left from memberships
where org_id='aaaaaaaa-0000-0000-0000-000000000001' and role='owner';

\echo '--- T7: revoked token is dead'
update scim_tokens set revoked_at = now() where token_hash='HASH_NORTHWIND';
select (scim_org_for_token('HASH_NORTHWIND') is null) as revoked_rejected;
