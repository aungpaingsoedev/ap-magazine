import Link from 'next/link';
import {
  estimateReadingMinutes,
  formatMagazineDate,
  magazineCategory,
} from '@/lib/blog-utils';
import { ReactionBar } from '@/components/blog/reaction-bar';
import { ShareButton } from '@/components/blog/share-button';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ReactionType } from '@/lib/db/schema';

type BlogCardProps = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | string | null;
  authorName: string | null;
  authorImage?: string | null;
  authorSlug?: string | null;
  coverImage?: string | null;
  category?: string;
  featured?: boolean;
  editorsPick?: boolean;
  index?: number;
  className?: string;
  reactionCounts?: { type: ReactionType; count: number }[];
  userReaction?: ReactionType | null;
  isSignedIn?: boolean;
  viewCount?: number;
};

function CoverArt({ seed, title }: { seed: string; title: string }) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const variant = hash % 4;

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
      <svg
        viewBox="0 0 400 400"
        className="h-full w-full"
        aria-hidden
        role="presentation"
      >
        <rect width="400" height="400" fill="#f5f5f5" />
        {variant === 0 && (
          <>
            <circle cx="200" cy="200" r="120" fill="none" stroke="#0a0a0a" strokeWidth="2" />
            <circle cx="200" cy="200" r="70" fill="#0a0a0a" />
            <rect x="40" y="40" width="80" height="80" fill="#0a0a0a" />
          </>
        )}
        {variant === 1 && (
          <>
            <path d="M0 320 L200 40 L400 320 Z" fill="#0a0a0a" />
            <circle cx="280" cy="120" r="48" fill="#f5f5f5" stroke="#0a0a0a" strokeWidth="2" />
          </>
        )}
        {variant === 2 && (
          <>
            <rect x="60" y="60" width="280" height="280" fill="none" stroke="#0a0a0a" strokeWidth="3" />
            <rect x="110" y="110" width="180" height="180" fill="#0a0a0a" />
            <line x1="0" y1="200" x2="400" y2="200" stroke="#0a0a0a" strokeWidth="1" />
          </>
        )}
        {variant === 3 && (
          <>
            <ellipse cx="200" cy="210" rx="130" ry="90" fill="#0a0a0a" />
            <circle cx="140" cy="110" r="36" fill="none" stroke="#0a0a0a" strokeWidth="2" />
            <circle cx="260" cy="100" r="22" fill="#0a0a0a" />
          </>
        )}
      </svg>
      <span className="sr-only">{title}</span>
    </div>
  );
}

export function BlogCard({
  id,
  slug,
  title,
  excerpt,
  publishedAt,
  authorName,
  authorImage = null,
  authorSlug = null,
  coverImage,
  category,
  featured = false,
  editorsPick = false,
  index = 0,
  className,
  reactionCounts = [],
  userReaction = null,
  isSignedIn = false,
  viewCount = 0,
}: BlogCardProps) {
  const tag = category ?? magazineCategory(slug);
  const minutes = estimateReadingMinutes(excerpt);
  const dateLabel = formatMagazineDate(publishedAt);

  return (
    <article
      className={cn(
        'magazine-card-enter group flex h-full flex-col p-5 sm:p-6',
        className,
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      data-category={tag}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <time className="text-xs text-neutral-500">{dateLabel || '—'}</time>
        <span className="rounded-full border border-neutral-950 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
          {tag}
        </span>
      </div>
      {featured || editorsPick ? (
        <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase text-neutral-500">
          {[featured ? 'Featured' : null, editorsPick ? "Editor's pick" : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      ) : null}

      <Link href={`/blog/${slug}`} className="block overflow-hidden">
        <div className="transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt=""
              className="aspect-square w-full object-cover grayscale"
            />
          ) : (
            <CoverArt seed={slug} title={title} />
          )}
        </div>
      </Link>

      <div className="mt-5 flex flex-1 flex-col">
        <Link href={`/blog/${slug}`}>
          <h2 className="font-display text-xl font-bold leading-snug tracking-tight text-neutral-950 transition-opacity group-hover:opacity-60 sm:text-2xl">
            {title}
          </h2>
        </Link>

        <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-neutral-600">
          {excerpt?.trim() ||
            'A new story from the magazine — open the piece to read the full article.'}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4 text-xs text-neutral-500">
          <div className="flex min-w-0 items-center gap-2">
            {authorSlug ? (
              <Link href={`/authors/${authorSlug}`} className="flex min-w-0 items-center gap-2 hover:opacity-70">
                <Avatar name={authorName} image={authorImage} size="sm" />
                <p>
                  <span className="text-neutral-400">Text</span>{' '}
                  <span className="font-medium text-neutral-950">
                    {authorName ?? 'Anonymous'}
                  </span>
                </p>
              </Link>
            ) : (
              <>
                <Avatar name={authorName} image={authorImage} size="sm" />
                <p>
                  <span className="text-neutral-400">Text</span>{' '}
                  <span className="font-medium text-neutral-950">
                    {authorName ?? 'Anonymous'}
                  </span>
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p>
              <span className="text-neutral-400">Views</span>{' '}
              <span className="font-medium text-neutral-950">
                {viewCount.toLocaleString()}
              </span>
            </p>
            <p>
              <span className="text-neutral-400">Duration</span>{' '}
              <span className="font-medium text-neutral-950">{minutes} Min</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          {id ? (
            <ReactionBar
              contentId={id}
              counts={reactionCounts}
              userReaction={userReaction}
              isSignedIn={isSignedIn}
              variant="compact"
            />
          ) : (
            <span />
          )}
          <ShareButton slug={slug} title={title} excerpt={excerpt} />
        </div>
      </div>
    </article>
  );
}
