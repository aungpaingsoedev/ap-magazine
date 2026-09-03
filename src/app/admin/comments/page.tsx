import { redirect } from 'next/navigation';
import { listAdminComments } from '@/lib/queries/admin';
import { can, getSession } from '@/lib/auth/session';
import { CommentsManager } from '@/components/admin/comments-manager';

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session?.user || !can(session.user, 'comments.moderate')) redirect('/admin');

  const { status } = await searchParams;
  const comments = await listAdminComments(status);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
          Moderation
        </p>
        <h1 className="font-display mt-2 text-3xl font-black">Comments</h1>
      </div>
      <form>
        <select
          name="status"
          defaultValue={status ?? 'all'}
          className="border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="spam">Spam</option>
        </select>
        <button type="submit" className="ml-2 border border-neutral-950 px-3 py-2 text-xs font-semibold uppercase">
          Filter
        </button>
      </form>
      <CommentsManager comments={comments} />
    </div>
  );
}
