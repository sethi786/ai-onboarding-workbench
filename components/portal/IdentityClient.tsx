'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Copy, Check, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select } from '@/components/ui/input';
import {
  addSsoDomain,
  removeSsoDomain,
  createScimToken,
  revokeScimToken,
} from '@/lib/actions/identity';

interface DomainRow {
  id: string;
  domain: string;
  verified_at: string | null;
  default_role: string;
  require_scim: boolean;
}
interface TokenRow {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}
interface ProvisionedRow {
  id: string;
  user_name: string;
  display_name: string | null;
  active: boolean;
  role: string;
  updated_at: string;
}

/**
 * Where an administrator wires their identity provider up.
 *
 * The two halves do different jobs and are presented as such: a domain decides
 * who may sign in, and SCIM decides who is entitled to be here at all. The
 * distinction matters because only the second one offboards people, and a
 * buyer who configures SSO alone often believes they have solved leavers.
 */
export function IdentityClient({
  orgId,
  orgSlug,
  canManage,
  scimBaseUrl,
  domains,
  tokens,
  provisioned,
}: {
  orgId: string;
  orgSlug: string;
  canManage: boolean;
  scimBaseUrl: string;
  domains: DomainRow[];
  tokens: TokenRow[];
  provisioned: ProvisionedRow[];
}) {
  const [pending, start] = useTransition();
  const [issued, setIssued] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (value: string, key: string) => {
    void navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  const activeTokens = tokens.filter((t) => !t.revoked_at);

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------ domains */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Sign-in domains</h2>
        <p className="mb-4 mt-1 text-sm leading-relaxed text-muted-foreground">
          People whose work email ends in one of these domains can sign in with your identity
          provider and are placed in this workspace automatically. Register the SAML connection with
          us first — see the setup note below.
        </p>

        {domains.length > 0 && (
          <div className="mb-4 divide-y divide-border rounded-md border border-border">
            {domains.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                <span className="font-mono">{d.domain}</span>
                {d.verified_at ? (
                  <Badge tone="success">Verified</Badge>
                ) : (
                  <Badge tone="warning">Pending verification</Badge>
                )}
                <Badge tone="neutral">Joins as {d.default_role}</Badge>
                {d.require_scim ? (
                  <Badge tone="electric">SCIM required</Badge>
                ) : (
                  <Badge tone="outline">Domain trust</Badge>
                )}
                <span className="flex-1" />
                {canManage && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const r = await removeSsoDomain(orgId, orgSlug, d.id);
                        if (r.error) toast.error(r.error);
                        else toast.success(`${d.domain} removed.`);
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!domains.some((d) => d.verified_at) && domains.length > 0 && (
          <p className="mb-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs leading-relaxed text-[oklch(0.45_0.09_75)]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            An unverified domain admits nobody. Verification proves you control the domain — without
            it, claiming one would let anyone with an address there into this workspace.
          </p>
        )}

        {canManage && (
          <form
            action={(fd) =>
              start(async () => {
                const r = await addSsoDomain(orgId, orgSlug, fd);
                if (r.error) toast.error(r.error);
                else toast.success('Domain added.');
              })
            }
            className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
          >
            <div>
              <Label htmlFor="domain">Domain</Label>
              <Input id="domain" name="domain" placeholder="northwind.com" required />
            </div>
            <div>
              <Label htmlFor="default_role">Joins as</Label>
              <Select id="default_role" name="default_role" defaultValue="member">
                <option value="viewer">viewer</option>
                <option value="member">member</option>
                <option value="admin">admin</option>
              </Select>
            </div>
            <label className="flex items-center gap-2 pb-2.5 text-sm">
              <input type="checkbox" name="require_scim" defaultChecked />
              Require SCIM
            </label>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center rounded-md bg-electric px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              Add domain
            </button>
          </form>
        )}
      </section>

      {/* -------------------------------------------------------------- SCIM */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Directory provisioning (SCIM 2.0)</h2>
        <p className="mb-4 mt-1 text-sm leading-relaxed text-muted-foreground">
          Point Okta, Entra ID, or any SCIM 2.0 client at the endpoint below. It creates access when
          somebody joins the group and removes it when they leave — which is the half that actually
          offboards people. SSO on its own only decides how they log in.
        </p>

        <div className="mb-4 space-y-2 rounded-md border border-border bg-muted/30 p-3">
          <Field label="Tenant URL" value={scimBaseUrl} onCopy={() => copy(scimBaseUrl, 'url')} copied={copied === 'url'} />
          <Field label="Authentication" value="HTTP Header — Bearer token" />
          <Field label="Supported" value="Users: create, read, update, patch, delete · filter by userName" />
        </div>

        {issued && (
          <div className="mb-4 rounded-md border border-electric/40 bg-electric/5 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-electric" /> Copy this token now
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              It is stored only as a hash, so this is the one time it can be shown.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-card px-2 py-1.5 font-mono text-xs">
                {issued}
              </code>
              <button
                type="button"
                onClick={() => copy(issued, 'token')}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs"
              >
                {copied === 'token' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </button>
            </div>
          </div>
        )}

        {activeTokens.length > 0 && (
          <div className="mb-4 divide-y divide-border rounded-md border border-border">
            {activeTokens.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                <span className="font-medium">{t.name}</span>
                <code className="font-mono text-xs text-muted-foreground">{t.token_prefix}…</code>
                <span className="text-xs text-muted-foreground">
                  {t.last_used_at
                    ? `last used ${new Date(t.last_used_at).toLocaleDateString()}`
                    : 'never used'}
                </span>
                <span className="flex-1" />
                {canManage && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const r = await revokeScimToken(orgId, orgSlug, t.id);
                        if (r.error) toast.error(r.error);
                        else toast.success('Token revoked.');
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {canManage && (
          <form
            action={(fd) =>
              start(async () => {
                const r = await createScimToken(orgId, orgSlug, fd);
                if (r.error) toast.error(r.error);
                else if (r.token) {
                  setIssued(r.token);
                  toast.success('Token issued.');
                }
              })
            }
            className="flex flex-wrap items-end gap-3"
          >
            <div className="min-w-[220px] flex-1">
              <Label htmlFor="name">Token name</Label>
              <Input id="name" name="name" placeholder="Okta production" />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium disabled:opacity-60"
            >
              Issue token
            </button>
          </form>
        )}
      </section>

      {/* ------------------------------------------------------- provisioned */}
      {provisioned.length > 0 && (
        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-5">
            <h2 className="font-semibold">Provisioned by your directory</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {provisioned.filter((p) => p.active).length} active of {provisioned.length}. Someone
              deactivated here loses their membership immediately.
            </p>
          </div>
          <div className="divide-y divide-border">
            {provisioned.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-sm">
                <span className="font-mono text-[13px]">{p.user_name}</span>
                {p.display_name && (
                  <span className="text-muted-foreground">{p.display_name}</span>
                )}
                <span className="flex-1" />
                <Badge tone="neutral">{p.role}</Badge>
                {p.active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="w-32 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <code className="flex-1 overflow-x-auto font-mono text-xs">{value}</code>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-7 items-center gap-1.5 rounded border border-border px-2 text-xs"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      )}
    </div>
  );
}
