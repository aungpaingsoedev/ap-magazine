import { SiteHeader } from '@/components/layout/site-header';
import { BlogCard } from '@/components/blog/blog-card';
import { getSession } from '@/lib/auth/session';
import { searchPublishedArticles } from '@/lib/queries/admin';
import {
  getReactionSummariesForContents,
  getUserReactionsForContents,
} from '@/lib/queries/blog';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const [results, session] = await Promise.all([
    q.trim() ? searchPublishedArticles(q.trim()) : Promise.resolve([]),
    getSession(),
  ]);

  const ids = results.map((post) => post.id);
  const [reactionMap, userReactionMap] = await Promise.all([
    getReactionSummariesForContents(ids),
    session?.user
      ? getUserReactionsForContents(ids, session.user.id)
      : Promise.resolve(new Map()),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        <h1 className="font-display text-4xl font-black">Search</h1>
        <form className="mt-6 max-w-xl">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search published stories"
            className="w-full border border-neutral-300 px-3 py-3 text-sm focus:border-neutral-950 focus:outline-none"
          />
        </form>
        {q.trim() ? (
          <p className="mt-6 text-sm text-neutral-500">{results.length} results</p>
        ) : null}
        <div className="magazine-grid mt-8">
          {results.map((post, index) => (
            <BlogCard
              key={post.id}
              id={post.id}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              publishedAt={post.publishedAt}
              authorName={post.authorName}
              authorImage={post.authorImage}
              authorSlug={post.authorSlug}
              coverImage={post.coverImage}
              category={post.categoryName ?? undefined}
              viewCount={post.viewCount ?? 0}
              reactionCounts={reactionMap.get(post.id) ?? []}
              userReaction={userReactionMap.get(post.id) ?? null}
              isSignedIn={Boolean(session?.user)}
              index={index}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
