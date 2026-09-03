import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';
import { can, getSession, type Permission } from '@/lib/auth/session';
import { ensureCmsDefaults } from '@/lib/db/seed';

const ALL_PERMISSIONS: Permission[] = [
  'admin.access',
  'articles.create',
  'articles.update_own',
  'articles.update_any',
  'articles.publish',
  'articles.delete',
  'taxonomy.manage',
  'authors.manage',
  'media.manage',
  'comments.moderate',
  'users.manage',
  'settings.manage',
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureCmsDefaults();
  const session = await getSession();

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  if (!can(session.user, 'admin.access')) {
    redirect('/');
  }

  const permissions = ALL_PERMISSIONS.filter((permission) =>
    can(session.user, permission),
  );

  return (
    <AdminShell
      userName={session.user.name}
      userEmail={session.user.email}
      permissions={permissions}
    >
      {children}
    </AdminShell>
  );
}
