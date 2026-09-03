import { redirect } from 'next/navigation';
import { TagManager } from '@/components/admin/tag-manager';
import { getAllTags } from '@/lib/queries/taxonomy';
import { can, getSession } from '@/lib/auth/session';

export default async function AdminTagsPage() {
  const session = await getSession();
  if (!session?.user || !can(session.user, 'taxonomy.manage')) redirect('/admin');

  const tags = await getAllTags();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
          Taxonomy
        </p>
        <h1 className="font-display mt-2 text-3xl font-black">Tags</h1>
      </div>
      <TagManager tags={tags} />
    </div>
  );
}
