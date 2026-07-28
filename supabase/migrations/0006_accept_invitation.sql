-- ============================================================================
-- 0006 — Redeeming invitations.
--
-- Invitations were being written but there was no way to accept one: the
-- invitee has no membership yet, so RLS hides both the invitation row and the
-- memberships table from them. This RPC closes that loop under SECURITY
-- DEFINER, matching on the invite token *and* the caller's verified email so a
-- leaked token alone can't join a stranger to a workspace.
-- ============================================================================

-- Look up an invitation by token without joining. Used to render the accept
-- screen ("Acme invited you as a reviewer") before the user commits.
create or replace function invitation_preview(p_token text)
returns table (org_name text, org_slug text, email text, role org_role, accepted boolean)
language sql
stable
security definer
set search_path = public
as $$
  select o.name, o.slug, i.email, i.role, i.accepted_at is not null
  from invitations i
  join organizations o on o.id = i.org_id
  where i.token = p_token
$$;

-- Accept an invitation and return the org slug to redirect into.
create or replace function accept_invitation(p_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite   invitations;
  v_slug     text;
  v_email    text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  select * into v_invite from invitations where token = p_token;
  if v_invite is null then
    raise exception 'This invitation link is not valid.';
  end if;

  -- The invite is addressed to one mailbox. Signing in as somebody else must
  -- not redeem it, even with a valid token.
  if lower(v_invite.email) <> lower(coalesce(v_email, '')) then
    raise exception 'This invitation was sent to %. Sign in with that email to accept it.', v_invite.email;
  end if;

  select slug into v_slug from organizations where id = v_invite.org_id;

  -- Already a member (or accepting twice): succeed quietly rather than error,
  -- so a re-clicked link lands them in the workspace instead of a dead end.
  insert into memberships (org_id, user_id, role)
  values (v_invite.org_id, auth.uid(), v_invite.role)
  on conflict (org_id, user_id) do nothing;

  update invitations
  set accepted_at = now()
  where id = v_invite.id and accepted_at is null;

  return v_slug;
end;
$$;

revoke all on function invitation_preview(text) from public;
revoke all on function accept_invitation(text) from public;
grant execute on function invitation_preview(text) to anon, authenticated;
grant execute on function accept_invitation(text) to authenticated;
