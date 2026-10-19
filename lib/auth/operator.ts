import 'server-only';
import { notFound } from 'next/navigation';
import { requireUser } from './require-user';

/** Operator access is provisioned out-of-band, never from editable user metadata. */
export function isOperator(user: { id: string; email_confirmed_at?: string }) {
  const ids = (process.env.AEGIS_ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id),
    );
  return Boolean(
    user.email_confirmed_at && ids.includes(user.id.toLowerCase()),
  );
}

export async function requireOperator() {
  const user = await requireUser('/admin');
  if (!isOperator(user)) notFound();
  return user;
}
