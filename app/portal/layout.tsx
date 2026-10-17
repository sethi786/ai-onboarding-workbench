import { UnsavedChanges } from '@/components/portal/UnsavedChanges';
export const metadata = { robots: { index: false, follow: false } };
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UnsavedChanges>{children}</UnsavedChanges>;
}
