import Link from 'next/link';
import { getDashboardStats } from '@/lib/queries/admin';
import { formatMagazineDate } from '@/lib/blog-utils';
import { StatusPill } from '@/components/admin/fields';

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-10">
      <div>
        <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
          Overview
        </p>
        <h1 className="font-display mt-2 text-3xl font-black">Dashboard</h1>
      </div>

      <div className="grid gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ['Total articles', stats.totalArticles],
          ['Published', stats.published],
          ['Drafts', stats.drafts],
          ['Scheduled', stats.scheduled],
          ['Authors', stats.authors],
          ['Categories', stats.categories],
        ].map(([label, value]) => (
          <div key={String(label)} className="bg-white p-6">
            <p className="text-xs tracking-wider text-neutral-500 uppercase">{label}</p>
            <p className="font-display mt-2 text-3xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Recent articles</h2>
          <Link href="/admin/articles/new" className="text-xs font-semibold tracking-wider uppercase underline">
            New article
          </Link>
        </div>
        <div className="overflow-x-auto border border-neutral-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs tracking-wider uppercase">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((article) => (
                <tr key={article.id} className="border-b border-neutral-200 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/articles/${article.id}`} className="font-medium hover:underline">
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{article.authorName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={article.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {formatMagazineDate(article.updatedAt)}
                  </td>
                </tr>
              ))}
              {stats.recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                    No articles yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
