import { SiteHeader } from '@/components/layout/site-header';
import { MagazineFeed } from '@/components/blog/magazine-feed';
import { getSession } from '@/lib/auth/session';
import {
  getPublishedPostsPage,
  getReactionSummariesForContents,
  getUserReactionsForContents,
} from '@/lib/queries/blog';
import { getActiveCategories, getSiteSettings } from '@/lib/queries/taxonomy';
import { extractCoverImage, magazineCategory } from '@/lib/blog-utils';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const requestedPage = Number(params.page ?? '1') || 1;

  const [categories, settings, session] = await Promise.all([
    getActiveCategories(),
    getSiteSettings(),
    getSession(),
  ]);

  const result = await getPublishedPostsPage({
    page: requestedPage,
    pageSize: settings?.articlesPerPage ?? 12,
  });

  const ids = result.rows.map((post) => post.id);
  const [reactionMap, userReactionMap] = await Promise.all([
    getReactionSummariesForContents(ids),
    session?.user
      ? getUserReactionsForContents(ids, session.user.id)
      : Promise.resolve(new Map()),
  ]);

  const magazinePosts = result.rows.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    authorName: post.authorName,
    authorImage: post.authorImage,
    authorSlug: post.authorSlug,
    coverImage: post.coverImage ?? extractCoverImage(post.body),
    category: post.categoryName ?? magazineCategory(post.slug),
    featured: post.featured,
    editorsPick: post.editorsPick,
    viewCount: post.viewCount ?? 0,
    reactionCounts: reactionMap.get(post.id) ?? [],
    userReaction: userReactionMap.get(post.id) ?? null,
  }));

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="magazine-hero-enter border-b border-neutral-200 py-10 sm:py-14 lg:py-16">
          <h1 className="font-display text-[clamp(3.5rem,14vw,9.5rem)] leading-[0.9] font-bold text-neutral-950">
            {settings?.homepageHeadline ?? 'Magazine'}
          </h1>
        </div>

        <MagazineFeed
          posts={magazinePosts}
          categories={categories.map((item) => ({
            name: item.name,
            slug: item.slug,
          }))}
          isSignedIn={Boolean(session?.user)}
          page={result.page}
          totalPages={result.totalPages}
          basePath="/"
        />
      </main>
    </div>
  );
}
