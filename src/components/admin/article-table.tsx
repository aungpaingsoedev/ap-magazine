'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  deleteArticle,
  setArticleStatus,
  toggleArticleFlag,
} from '@/actions/articles';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { AdminButton, StatusPill } from '@/components/admin/fields';
import { formatMagazineDate } from '@/lib/blog-utils';

type Row = {
  id: string;
  title: string;
  status: string;
  featured: boolean;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
  authorName: string | null;
  categoryName: string | null;
};

export function ArticleTable({
  rows,
  canPublish,
  canDelete,
}: {
  rows: Row[];
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();

  async function refresh(
    action: () => Promise<{ success: boolean; error?: string }>,
  ) {
    const result = await action();
    if (result.success) router.refresh();
    return result;
  }

  return (
    <div className="overflow-x-auto border border-neutral-200">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs tracking-wider uppercase">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Author</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Published</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-neutral-200 last:border-0">
              <td className="px-4 py-3">
                <Link href={`/admin/articles/${row.id}`} className="font-medium hover:underline">
                  {row.title}
                </Link>
                {row.featured ? (
                  <span className="ml-2 text-[10px] tracking-wider uppercase text-neutral-500">
                    Featured
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-neutral-600">{row.authorName ?? '—'}</td>
              <td className="px-4 py-3 text-neutral-600">{row.categoryName ?? '—'}</td>
              <td className="px-4 py-3">
                <StatusPill status={row.status} />
              </td>
              <td className="px-4 py-3 text-neutral-500">
                {formatMagazineDate(row.publishedAt)}
              </td>
              <td className="px-4 py-3 text-neutral-500">
                {formatMagazineDate(row.updatedAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <Link href={`/admin/articles/${row.id}`}>
                    <AdminButton type="button" variant="ghost">
                      Edit
                    </AdminButton>
                  </Link>
                  {canPublish && row.status !== 'published' ? (
                    <ConfirmButton
                      label="Publish"
                      confirmTitle="Publish this article?"
                      confirmBody="It will appear on the public magazine immediately."
                      onConfirm={() => refresh(() => setArticleStatus(row.id, 'published'))}
                    />
                  ) : null}
                  {canPublish && row.status === 'published' ? (
                    <ConfirmButton
                      label="Unpublish"
                      confirmTitle="Unpublish this article?"
                      confirmBody="It will revert to draft and leave the public site."
                      onConfirm={() => refresh(() => setArticleStatus(row.id, 'draft'))}
                    />
                  ) : null}
                  {canPublish ? (
                    <ConfirmButton
                      label="Archive"
                      confirmTitle="Archive this article?"
                      confirmBody="Archived articles are hidden from the magazine."
                      onConfirm={() => refresh(() => setArticleStatus(row.id, 'archived'))}
                    />
                  ) : null}
                  {canPublish ? (
                    <AdminButton
                      type="button"
                      variant="ghost"
                      onClick={() => toggleArticleFlag(row.id, 'featured').then(() => router.refresh())}
                    >
                      {row.featured ? 'Unfeature' : 'Feature'}
                    </AdminButton>
                  ) : null}
                  {canDelete ? (
                    <ConfirmButton
                      label="Delete"
                      confirmTitle="Delete this article?"
                      confirmBody="This cannot be undone."
                      confirmLabel="Delete"
                      onConfirm={() => refresh(() => deleteArticle(row.id))}
                    />
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-neutral-500">
                No articles match these filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
