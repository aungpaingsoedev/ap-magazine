import { ArticleEditorForm } from '@/components/admin/article-editor-form';
import { getAllCategories, getAllTags } from '@/lib/queries/taxonomy';
import { listAuthors } from '@/lib/queries/admin';
import { can, getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function NewArticlePage() {
  const session = await getSession();
  if (!session?.user || !can(session.user, 'articles.create')) {
    redirect('/admin');
  }
  const [categories, tags, authors] = await Promise.all([
    getAllCategories(),
    getAllTags(),
    listAuthors(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
          Articles
        </p>
        <h1 className="font-display mt-2 text-3xl font-black">New article</h1>
      </div>
      <ArticleEditorForm
        categories={categories.map((item) => ({ id: item.id, name: item.name }))}
        tags={tags.map((item) => ({ id: item.id, name: item.name }))}
        authors={authors.map((item) => ({ id: item.id, name: item.name }))}
        canPublish={session?.user ? can(session.user, 'articles.publish') : false}
        canAssignAuthor={session?.user ? can(session.user, 'articles.update_any') : false}
      />
    </div>
  );
}
