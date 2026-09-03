import { redirect } from 'next/navigation';
import { AuthorManager } from '@/components/admin/author-manager';
import { listAuthors } from '@/lib/queries/admin';
import { can, getSession } from '@/lib/auth/session';

export default async function AdminAuthorsPage() {
  const session = await getSession();
  if (!session?.user || !can(session.user, 'authors.manage')) redirect('/admin');

  const authors = await listAuthors();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
          People
        </p>
        <h1 className="font-display mt-2 text-3xl font-black">Authors</h1>
      </div>
      <AuthorManager authors={authors} />
    </div>
  );
}
