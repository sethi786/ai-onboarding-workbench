import { SettingsTabs } from '@/components/portal/SettingsTabs';

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="display-md">Settings</h1>
      <SettingsTabs orgSlug={orgSlug} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
