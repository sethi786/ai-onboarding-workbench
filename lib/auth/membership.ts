import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { OrganizationRow, OrgRole } from '@/lib/db/types';
import { requireUser } from './require-user';

export interface OrgMembership {
  org: OrganizationRow;
  role: OrgRole;
}

/** All orgs the current user belongs to, with their role. */
export async function listMyOrganizations(): Promise<OrgMembership[]> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('memberships')
    .select('role, organizations(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (error) throw new Error('Could not load workspace memberships. Please retry.');
  if (!data) return [];
  return data
    .filter((m) => m.organizations)
    .map((m) => ({
      role: m.role as OrgRole,
      org: m.organizations as unknown as OrganizationRow,
    }));
}

/** Resolve an org by slug for the current user, or notFound(). */
export async function requireMembership(orgSlug: string): Promise<OrgMembership> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('memberships')
    .select('role, organizations!inner(*)')
    .eq('user_id', user.id)
    .eq('organizations.slug', orgSlug)
    .maybeSingle();
  if (error || !data || !data.organizations) notFound();
  return {
    role: data.role as OrgRole,
    org: data.organizations as unknown as OrganizationRow,
  };
}
