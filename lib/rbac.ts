import type { OrgRole } from '@/lib/db/types';

/** UX mirror of the RLS matrix — RLS remains the real enforcement. */
export const ROLE_RANK: Record<OrgRole, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

export function canEdit(role: OrgRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.member;
}
export function canManageOrg(role: OrgRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.admin;
}
export function canDeleteEvaluation(role: OrgRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.admin;
}
