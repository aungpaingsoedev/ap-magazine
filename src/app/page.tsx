import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { MagazineFeed } from '@/components/blog/magazine-feed';
import { getSession } from '@/lib/auth/session';
import {
  getPublishedPostsPage,
  getReactionSummariesForContents,
  getUserReactionsForContents,
} from '@/lib/queries/blog';
import { getActiveCategories, getSiteSettings } from '@/lib/queries/taxonomy';
import { magazineCategory } from '@/lib/blog-utils';

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
    coverImage: post.coverImage,
    category: post.categoryName ?? magazineCategory(post.slug),
    featured: post.featured,
    editorsPick: post.editorsPick,
    viewCount: post.viewCount ?? 0,
    readingTime: post.readingTime,
    reactionCounts: reactionMap.get(post.id) ?? [],
    userReaction: userReactionMap.get(post.id) ?? null,
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="magazine-hero-enter border-b-2 border-dashed border-ink/30 py-5 sm:py-6 lg:py-8">
          <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-teal uppercase">
            Sketchbook issue
          </p>
          <h1 className="font-display hero-sketch-title text-[clamp(2.75rem,10vw,6.5rem)] leading-[0.92] text-ink">
            {settings?.homepageHeadline ?? 'Magazine'}
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted sm:text-lg">
            Stories drawn in ink — essays, culture, and quiet observations from the studio.
          </p>
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
      <SiteFooter />
    </div>
  );
}
