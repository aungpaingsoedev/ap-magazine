import Link from 'next/link';
import { listAdminArticles, listAuthors } from '@/lib/queries/admin';
import { getAllCategories } from '@/lib/queries/taxonomy';
import { ArticleTable } from '@/components/admin/article-table';
import { Select, TextInput } from '@/components/admin/fields';
import { can, getSession } from '@/lib/auth/session';
import type { ContentStatus } from '@/lib/db/schema';

type SearchParams = Promise<{
  q?: string;
  status?: string;
  categoryId?: string;
  authorId?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
}>;

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const session = await getSession();
  const canPublish = session?.user ? can(session.user, 'articles.publish') : false;
  const canDelete = session?.user ? can(session.user, 'articles.delete') : false;
  const canSeeAll = session?.user ? can(session.user, 'articles.update_any') : false;

  const [result, categories, authors] = await Promise.all([
    listAdminArticles({
      q: params.q,
      status: (params.status as ContentStatus | 'all' | undefined) ?? 'all',
      categoryId: params.categoryId,
      authorId: canSeeAll ? params.authorId : session?.user.id,
      from: params.from,
      to: params.to,
      sort: (params.sort as 'updated' | 'published' | 'title' | undefined) ?? 'updated',
      page: Number(params.page ?? '1'),
    }),
    getAllCategories(),
    listAuthors(),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
            Content
          </p>
          <h1 className="font-display mt-2 text-3xl font-black">Articles</h1>
        </div>
        <Link
          href="/admin/articles/new"
          className="border border-neutral-950 bg-neutral-950 px-4 py-2 text-xs font-semibold tracking-wider text-white uppercase"
        >
          New article
        </Link>
      </div>

      <form className="grid gap-3 border border-neutral-200 p-4 md:grid-cols-4 lg:grid-cols-7">
        <TextInput name="q" defaultValue={params.q} placeholder="Search" />
        <Select name="status" defaultValue={params.status ?? 'all'}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
        <Select name="categoryId" defaultValue={params.categoryId ?? ''}>
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        {canSeeAll ? (
          <Select name="authorId" defaultValue={params.authorId ?? ''}>
            <option value="">All authors</option>
            {authors.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        ) : null}
        <TextInput type="date" name="from" defaultValue={params.from} />
        <TextInput type="date" name="to" defaultValue={params.to} />
        <Select name="sort" defaultValue={params.sort ?? 'updated'}>
          <option value="updated">Updated</option>
          <option value="published">Published</option>
          <option value="title">Title</option>
        </Select>
        <button
          type="submit"
          className="border border-neutral-950 px-4 py-2 text-xs font-semibold tracking-wider uppercase"
        >
          Filter
        </button>
      </form>

      <ArticleTable rows={result.rows} canPublish={canPublish} canDelete={canDelete} />

      <div className="flex items-center justify-between text-sm text-neutral-500">
        <p>
          {result.total} articles · page {result.page} of {totalPages}
        </p>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Link href={`?${new URLSearchParams({ ...params, page: String(result.page - 1) }).toString()}`}>
              Previous
            </Link>
          ) : null}
          {result.page < totalPages ? (
            <Link href={`?${new URLSearchParams({ ...params, page: String(result.page + 1) }).toString()}`}>
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
