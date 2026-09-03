import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { MagazineFeed } from '@/components/blog/magazine-feed';
import { getSession } from '@/lib/auth/session';
import { getActiveCategories, getCategoryBySlug, getSiteSettings } from '@/lib/queries/taxonomy';
import {
  getPublishedPostsByCategoryPage,
  getReactionSummariesForContents,
  getUserReactionsForContents,
} from '@/lib/queries/blog';

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const requestedPage = Number(pageParam ?? '1') || 1;

  const category = await getCategoryBySlug(slug);
  if (!category || !category.active) notFound();

  const [settings, session, categories] = await Promise.all([
    getSiteSettings(),
    getSession(),
    getActiveCategories(),
  ]);

  const result = await getPublishedPostsByCategoryPage(slug, {
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
    category: post.categoryName ?? category.name,
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
        <div className="border-b border-neutral-200 py-10">
          <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
            Category
          </p>
          <h1 className="font-display mt-3 text-[clamp(3rem,10vw,6rem)] font-bold leading-[0.95]">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-4 max-w-xl text-neutral-600">{category.description}</p>
          ) : null}
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
          basePath={`/category/${slug}`}
          activeCategorySlug={slug}
        />
      </main>
    </div>
  );
}
