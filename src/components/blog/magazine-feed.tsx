import { BlogCard } from '@/components/blog/blog-card';
import { CategoryFilter } from '@/components/blog/category-filter';
import { MagazinePagination } from '@/components/blog/magazine-pagination';
import type { ReactionType } from '@/lib/db/schema';

export type MagazinePost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | string | null;
  authorName: string | null;
  authorImage?: string | null;
  authorSlug?: string | null;
  coverImage: string | null;
  category: string;
  featured?: boolean;
  editorsPick?: boolean;
  viewCount?: number;
  readingTime?: number | null;
  reactionCounts?: { type: ReactionType; count: number }[];
  userReaction?: ReactionType | null;
};

type MagazineFeedProps = {
  posts: MagazinePost[];
  categories: { name: string; slug: string }[];
  isSignedIn?: boolean;
  page?: number;
  totalPages?: number;
  basePath?: string;
  activeCategorySlug?: string | null;
};

export function MagazineFeed({
  posts,
  categories,
  isSignedIn = false,
  page = 1,
  totalPages = 1,
  basePath = '/',
  activeCategorySlug = null,
}: MagazineFeedProps) {
  return (
    <section id="stories">
      <CategoryFilter categories={categories} activeSlug={activeCategorySlug} />

      {posts.length === 0 ? (
        <div className="border-2 border-dashed border-ink/35 px-6 py-20 text-center sketch-frame">
          <p className="font-display text-lg text-ink">
            {activeCategorySlug ? 'No stories in this category' : 'No posts yet'}
          </p>
          <p className="mt-2 text-sm text-muted">
            {activeCategorySlug
              ? 'Try another filter or publish a new piece.'
              : 'Sign in and write the first magazine story.'}
          </p>
        </div>
      ) : (
        <div className="magazine-grid">
          {posts.map((post, index) => (
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
              category={post.category}
              featured={post.featured}
              editorsPick={post.editorsPick}
              viewCount={post.viewCount ?? 0}
              readingTime={post.readingTime}
              reactionCounts={post.reactionCounts}
              userReaction={post.userReaction ?? null}
              isSignedIn={isSignedIn}
              index={index}
            />
          ))}
        </div>
      )}

      <MagazinePagination
        page={page}
        totalPages={totalPages}
        basePath={basePath}
      />
    </section>
  );
}
