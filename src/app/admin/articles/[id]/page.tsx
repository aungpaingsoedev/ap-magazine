import { notFound } from 'next/navigation';
import { ArticleEditorForm } from '@/components/admin/article-editor-form';
import { getAdminArticle, getArticleRevisions, listAuthors } from '@/lib/queries/admin';
import { getAllCategories, getAllTags } from '@/lib/queries/taxonomy';
import { can, getSession } from '@/lib/auth/session';

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const article = await getAdminArticle(id);

  if (!article) notFound();

  const isOwner = article.createdBy === session?.user.id;
  const canEdit =
    session?.user &&
    (can(session.user, 'articles.update_any') ||
      (can(session.user, 'articles.update_own') && isOwner));

  if (!canEdit) notFound();

  const [categories, tags, authors, revisions] = await Promise.all([
    getAllCategories(),
    getAllTags(),
    listAuthors(),
    getArticleRevisions(id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
          Articles
        </p>
        <h1 className="font-display mt-2 text-3xl font-black">Edit article</h1>
      </div>
      <ArticleEditorForm
        article={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          coverImage: article.coverImage,
          body: article.body,
          categoryId: article.categoryId,
          categoryIds: article.categoryIds,
          tagIds: article.tagIds,
          createdBy: article.createdBy,
          featured: article.featured,
          editorsPick: article.editorsPick,
          displayOrder: article.displayOrder,
          publishedAt: article.publishedAt,
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
          seoImage: article.seoImage,
          canonicalUrl: article.canonicalUrl,
          noIndex: article.noIndex,
          noFollow: article.noFollow,
        }}
        categories={categories.map((item) => ({ id: item.id, name: item.name }))}
        tags={tags.map((item) => ({ id: item.id, name: item.name }))}
        authors={authors.map((item) => ({ id: item.id, name: item.name }))}
        revisions={revisions}
        canPublish={session?.user ? can(session.user, 'articles.publish') : false}
        canAssignAuthor={session?.user ? can(session.user, 'articles.update_any') : false}
      />
    </div>
  );
}
