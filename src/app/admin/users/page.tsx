import { redirect } from 'next/navigation';
import { UsersManager } from '@/components/admin/users-manager';
import { listAuthors } from '@/lib/queries/admin';
import { can, getSession } from '@/lib/auth/session';

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session?.user || !can(session.user, 'users.manage')) redirect('/admin');

  const users = await listAuthors();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
          Access
        </p>
        <h1 className="font-display mt-2 text-3xl font-black">Users</h1>
      </div>
      <UsersManager users={users} />
    </div>
  );
}
