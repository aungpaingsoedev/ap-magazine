import { redirect } from 'next/navigation';
import { CategoryManager } from '@/components/admin/category-manager';
import { getAllCategories } from '@/lib/queries/taxonomy';
import { can, getSession } from '@/lib/auth/session';

export default async function AdminCategoriesPage() {
  const session = await getSession();
  if (!session?.user || !can(session.user, 'taxonomy.manage')) redirect('/admin');

  const categories = await getAllCategories();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
          Taxonomy
        </p>
        <h1 className="font-display mt-2 text-3xl font-black">Categories</h1>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
