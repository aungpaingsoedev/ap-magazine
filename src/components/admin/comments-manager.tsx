'use client';

import { useRouter } from 'next/navigation';
import { deleteComment, moderateComment } from '@/actions/comments';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { AdminButton, StatusPill } from '@/components/admin/fields';
import { formatMagazineDate } from '@/lib/blog-utils';

type CommentRow = {
  id: string;
  body: string;
  status: string;
  createdAt: Date | string;
  authorName: string | null;
  articleTitle: string;
  articleSlug: string;
};

export function CommentsManager({ comments }: { comments: CommentRow[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto border border-neutral-200">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs tracking-wider uppercase">
          <tr>
            <th className="px-4 py-3">Comment</th>
            <th className="px-4 py-3">Author</th>
            <th className="px-4 py-3">Article</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((item) => (
            <tr key={item.id} className="border-b border-neutral-200 last:border-0">
              <td className="max-w-sm px-4 py-3">{item.body}</td>
              <td className="px-4 py-3">{item.authorName}</td>
              <td className="px-4 py-3">{item.articleTitle}</td>
              <td className="px-4 py-3">
                <StatusPill status={item.status} />
              </td>
              <td className="px-4 py-3 text-neutral-500">
                {formatMagazineDate(item.createdAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {(['approved', 'rejected', 'spam', 'pending'] as const).map((status) => (
                    <AdminButton
                      key={status}
                      type="button"
                      variant="ghost"
                      onClick={async () => {
                        await moderateComment(item.id, status);
                        router.refresh();
                      }}
                    >
                      {status}
                    </AdminButton>
                  ))}
                  <ConfirmButton
                    label="Delete"
                    confirmTitle="Delete comment?"
                    confirmBody="This cannot be undone."
                    onConfirm={async () => {
                      const result = await deleteComment(item.id);
                      if (result.success) router.refresh();
                      return result;
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
