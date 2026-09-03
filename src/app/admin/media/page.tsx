import { redirect } from 'next/navigation';
import { MediaLibrary } from '@/components/admin/media-library';
import { listMedia } from '@/lib/queries/admin';
import { can, getSession } from '@/lib/auth/session';

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session?.user || !can(session.user, 'media.manage')) redirect('/admin');

  const { q } = await searchParams;
  const items = await listMedia(q);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
          Assets
        </p>
        <h1 className="font-display mt-2 text-3xl font-black">Media library</h1>
      </div>
      <form className="max-w-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search media"
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-950 focus:outline-none"
        />
      </form>
      <MediaLibrary items={items} />
    </div>
  );
}
