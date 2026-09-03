import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { BlogReader } from '@/components/blog/blog-reader';
import { ReactionBar } from '@/components/blog/reaction-bar';
import { CommentSection } from '@/components/blog/comment-section';
import { ShareButton } from '@/components/blog/share-button';
import { ViewTracker } from '@/components/blog/view-tracker';
import { Avatar } from '@/components/ui/avatar';
import { getSession } from '@/lib/auth/session';
import {
  getPostBySlug,
  getPostComments,
  getPostReactions,
  getUserReaction,
} from '@/lib/queries/blog';
import { getArticleCategories, getArticleTags, getSiteSettings } from '@/lib/queries/taxonomy';
import {
  estimateReadingMinutes,
  formatMagazineDate,
  magazineCategory,
} from '@/lib/blog-utils';
import type { ReactionType } from '@/lib/db/schema';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()]);
  if (!post) return { title: 'Not found' };

  const title = post.seoTitle || post.title;
  const description =
    post.seoDescription || post.excerpt || settings?.defaultSeoDescription || '';
  const image = post.seoImage || post.coverImage || settings?.defaultSeoImage || undefined;
  const canonical = post.canonicalUrl || undefined;

  return {
    title,
    description,
    robots: {
      index: !post.noIndex,
      follow: !post.noFollow,
    },
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: 'article',
      title,
      description,
      images: image ? [{ url: image }] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const session = await getSession();
  const [comments, reactions, userReaction, tags, categories, settings] = await Promise.all([
    getPostComments(post.id),
    getPostReactions(post.id),
    session?.user
      ? getUserReaction(post.id, session.user.id)
      : Promise.resolve(null),
    getArticleTags(post.id),
    getArticleCategories(post.id),
    getSiteSettings(),
  ]);

  const reactionCounts = reactions.map((item) => ({
    type: item.type as ReactionType,
    count: Number(item.count),
  }));

  const fallbackCategory = post.categoryName ?? magazineCategory(post.slug);
  const displayCategories =
    categories.length > 0
      ? categories
      : post.categorySlug
        ? [{ id: 'primary', name: fallbackCategory, slug: post.categorySlug }]
        : [{ id: 'fallback', name: fallbackCategory, slug: null as string | null }];
  const minutes = post.readingTime ?? estimateReadingMinutes(post.excerpt, post.body);
  const dateLabel = formatMagazineDate(post.publishedAt);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    image: post.seoImage || post.coverImage,
    datePublished: post.publishedAt,
    author: post.authorName
      ? { '@type': 'Person', name: post.authorName }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: settings?.siteName ?? 'Atlas Magazine',
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <ViewTracker contentId={post.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase transition-opacity hover:opacity-60"
        >
          ← Magazine
        </Link>

        <article className="mt-8 space-y-10">
          <header className="space-y-6 border-b border-neutral-200 pb-10">
            <div className="flex flex-wrap items-center gap-3">
              <time className="text-xs text-neutral-500">{dateLabel || '—'}</time>
              {displayCategories.map((item) =>
                item.slug ? (
                  <Link
                    key={item.id}
                    href={`/category/${item.slug}`}
                    className="rounded-full border border-neutral-950 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span
                    key={item.id}
                    className="rounded-full border border-neutral-950 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase"
                  >
                    {item.name}
                  </span>
                ),
              )}
            </div>

            <h1 className="font-display text-4xl leading-[1.05] font-black tracking-tight text-neutral-950 sm:text-5xl">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="max-w-2xl text-lg leading-relaxed text-neutral-600">
                {post.excerpt}
              </p>
            )}

            {post.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.coverImage}
                alt=""
                className="aspect-[16/10] w-full object-cover grayscale"
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-5 text-sm">
              <div className="flex items-center gap-3 text-neutral-500">
                <Avatar
                  name={post.authorName}
                  image={post.authorImage}
                  size="md"
                />
                <p>
                  <span className="text-neutral-400">Text</span>{' '}
                  {post.authorSlug ? (
                    <Link href={`/authors/${post.authorSlug}`} className="font-medium text-neutral-950 hover:underline">
                      {post.authorName ?? 'Anonymous'}
                    </Link>
                  ) : (
                    <span className="font-medium text-neutral-950">
                      {post.authorName ?? 'Anonymous'}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-neutral-500">
                  <span className="text-neutral-400">Views</span>{' '}
                  <span className="font-medium text-neutral-950">
                    {(post.viewCount ?? 0).toLocaleString()}
                  </span>
                </p>
                <p className="text-neutral-500">
                  <span className="text-neutral-400">Duration</span>{' '}
                  <span className="font-medium text-neutral-950">{minutes} Min</span>
                </p>
                <ShareButton
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  variant="button"
                />
              </div>
            </div>
            {tags.length > 0 ? (
              <p className="text-xs tracking-wider text-neutral-500 uppercase">
                {tags.map((tag) => tag.name).join(' · ')}
              </p>
            ) : null}
          </header>

          <div className="magazine-prose">
            <BlogReader content={post.body} />
          </div>

          <div className="border border-neutral-200 p-6">
            <ReactionBar
              contentId={post.id}
              counts={reactionCounts}
              userReaction={userReaction}
              isSignedIn={Boolean(session?.user)}
            />
          </div>

          <div className="border border-neutral-200 p-6">
            <CommentSection
              contentId={post.id}
              comments={comments}
              isSignedIn={Boolean(session?.user)}
            />
          </div>
        </article>
      </main>
    </div>
  );
}
