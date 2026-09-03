import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/admin/settings-form';
import { getSiteSettings } from '@/lib/queries/taxonomy';
import { can, getSession } from '@/lib/auth/session';

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session?.user || !can(session.user, 'settings.manage')) redirect('/admin');

  const settings = await getSiteSettings();
  if (!settings) redirect('/admin');

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
          Site
        </p>
        <h1 className="font-display mt-2 text-3xl font-black">Settings</h1>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
