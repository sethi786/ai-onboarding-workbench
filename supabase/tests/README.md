# Database tests

Postgres-level tests for the parts of the tenant boundary that live in SQL
rather than in application code. They run against a plain PostgreSQL 16
instance with a stubbed `auth` schema, so they need no Supabase project.

```bash
D=/tmp/aegispg; rm -rf $D; mkdir -p $D && chown postgres:postgres $D
su postgres -c "initdb -D $D -U postgres --auth=trust"
su postgres -c "pg_ctl -D $D -o '-k /tmp -p 5599 -c listen_addresses=' -l $D/log start"

su postgres -c "psql -h /tmp -p 5599 -U postgres -q -f supabase/tests/_auth_stub.sql"
for f in supabase/migrations/*.sql; do
  su postgres -c "psql -h /tmp -p 5599 -U postgres -v ON_ERROR_STOP=1 -q -f $PWD/$f"
done
su postgres -c "psql -h /tmp -p 5599 -U postgres -f supabase/tests/scim_isolation.sql"
```

## scim_isolation.sql

What it proves, and why each one is here:

| | Claim |
|---|---|
| T1 | A SCIM token resolves to its own workspace and nothing else; an unknown token resolves to nothing. |
| T2 | Provisioning a user records them against the right workspace. |
| T3 | A provisioned user who already has an account gets a membership. |
| T4 | **Cross-tenant.** A second workspace's token cannot list, read, or delete the first's users. This is the one that matters. |
| T5 | Deactivation actually removes the membership — offboarding is real, not cosmetic. |
| T6 | The workspace owner survives a directory sync. Caught a genuine bug: the domain's default role of `member` demoted the owner, which then let the next deactivation strip the last owner and lock the workspace out of its own settings. |
| T7 | A revoked token is dead immediately. |
