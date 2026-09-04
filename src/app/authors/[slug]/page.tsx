import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteShell } from '@/components/layout/site-shell';
import { BlogCard } from '@/components/blog/blog-card';
import { MagazinePagination } from '@/components/blog/magazine-pagination';
import { Avatar } from '@/components/ui/avatar';
import { getSession } from '@/lib/auth/session';
import { getAuthorArticles, getAuthorBySlug } from '@/lib/queries/admin';
import { getSiteSettings } from '@/lib/queries/taxonomy';
import {
  getReactionSummariesForContents,
  getUserReactionsForContents,
} from '@/lib/queries/blog';

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const requestedPage = Number(pageParam ?? '1') || 1;

  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const [settings, session] = await Promise.all([
    getSiteSettings(),
    getSession(),
  ]);

  if (session?.user?.id === author.id) {
    redirect('/profile');
  }

  const result = await getAuthorArticles(author.id, {
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

  return (
    <SiteShell>
      <SiteHeader />
      <main className="site-pad flex-1 py-12">
        <Link
          href="/authors"
          className="text-xs font-semibold tracking-[0.16em] uppercase text-muted"
        >
          ← Authors
        </Link>
        <header className="mt-8 max-w-4xl border-b-2 border-dashed border-ink/30 pb-10">
          <div className="flex items-start gap-5">
            <Avatar name={author.name} image={author.image} size="xl" />
            <div>
              <h1 className="font-display hero-sketch-title text-4xl text-ink sm:text-5xl">
                {author.name}
              </h1>
              {author.bio ? (
                <p className="mt-4 text-muted">{author.bio}</p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                {author.website ? (
                  <a className="underline decoration-dashed underline-offset-4" href={author.website}>
                    Website
                  </a>
                ) : null}
                {author.instagram ? (
                  <a className="underline decoration-dashed underline-offset-4" href={author.instagram}>
                    Instagram
                  </a>
                ) : null}
                {author.twitter ? (
                  <a className="underline decoration-dashed underline-offset-4" href={author.twitter}>
                    X
                  </a>
                ) : null}
                {author.youtube ? (
                  <a className="underline decoration-dashed underline-offset-4" href={author.youtube}>
                    YouTube
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </header>
        <div className="magazine-grid mt-0">
          {result.rows.map((post, index) => (
            <BlogCard
              key={post.id}
              id={post.id}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              publishedAt={post.publishedAt}
              authorName={author.name}
              authorImage={author.image}
              authorSlug={author.slug}
              coverImage={post.coverImage}
              category={post.categoryName ?? undefined}
              viewCount={post.viewCount ?? 0}
              readingTime={post.readingTime}
              reactionCounts={reactionMap.get(post.id) ?? []}
              userReaction={userReactionMap.get(post.id) ?? null}
              isSignedIn={Boolean(session?.user)}
              index={index}
            />
          ))}
        </div>
        {result.rows.length === 0 ? (
          <p className="py-16 text-sm text-muted">No published articles yet.</p>
        ) : null}
        <MagazinePagination
          page={result.page}
          totalPages={result.totalPages}
          basePath={`/authors/${slug}`}
        />
      </main>
      <SiteFooter />
    </SiteShell>
  );
}
