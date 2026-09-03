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

const ACCENTS = ['#4f7c7a', '#c57a6a', '#c4a35a', '#3a342f'] as const;

function CoverArt({ seed, title }: { seed: string; title: string }) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const variant = hash % 4;
  const accent = ACCENTS[hash % ACCENTS.length]!;

  return (
    <div className="cover-sketch relative aspect-square w-full overflow-hidden bg-paper-deep">
      <svg
        viewBox="0 0 400 400"
        className="h-full w-full"
        aria-hidden
        role="presentation"
      >
        <rect width="400" height="400" fill="#efe6d6" />
        <circle cx="320" cy="70" r="48" fill={accent} opacity="0.28" />
        <circle cx="60" cy="330" r="36" fill={accent} opacity="0.18" />
        {variant === 0 && (
          <>
            <circle cx="200" cy="200" r="118" fill="none" stroke="#1f1a17" strokeWidth="3" strokeDasharray="6 5" />
            <circle cx="200" cy="200" r="68" fill="none" stroke="#1f1a17" strokeWidth="2.5" />
            <path d="M90 90 h70 v70 h-70 z" fill="none" stroke="#1f1a17" strokeWidth="2.5" />
          </>
        )}
        {variant === 1 && (
          <>
            <path d="M30 330 L205 55 L370 330 Z" fill="none" stroke="#1f1a17" strokeWidth="3" />
            <circle cx="270" cy="140" r="42" fill="none" stroke="#1f1a17" strokeWidth="2.5" />
            <path d="M120 280 q80 -40 160 0" fill="none" stroke="#1f1a17" strokeWidth="2" />
          </>
        )}
        {variant === 2 && (
          <>
            <rect x="58" y="58" width="284" height="284" fill="none" stroke="#1f1a17" strokeWidth="3" rx="8" />
            <rect x="108" y="108" width="184" height="184" fill="none" stroke="#1f1a17" strokeWidth="2.5" rx="4" />
            <line x1="20" y1="200" x2="380" y2="200" stroke="#1f1a17" strokeWidth="1.5" strokeDasharray="4 6" />
          </>
        )}
        {variant === 3 && (
          <>
            <ellipse cx="200" cy="215" rx="128" ry="88" fill="none" stroke="#1f1a17" strokeWidth="3" />
            <circle cx="145" cy="115" r="34" fill="none" stroke="#1f1a17" strokeWidth="2.5" />
            <circle cx="255" cy="105" r="20" fill={accent} opacity="0.45" stroke="#1f1a17" strokeWidth="2" />
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
        <time className="text-xs text-muted">{dateLabel || '—'}</time>
        <span className="sketch-stamp px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-ink">
          {tag}
        </span>
      </div>
      {featured || editorsPick ? (
        <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-coral uppercase">
          {[featured ? 'Featured' : null, editorsPick ? "Editor's pick" : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      ) : null}

      <Link href={`/blog/${slug}`} className="block overflow-hidden">
        <div className="transition-transform duration-500 ease-out group-hover:rotate-[-0.6deg] group-hover:scale-[1.02]">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt=""
              className="cover-sketch aspect-square w-full object-cover"
            />
          ) : (
            <CoverArt seed={slug} title={title} />
          )}
        </div>
      </Link>

      <div className="mt-5 flex flex-1 flex-col">
        <Link href={`/blog/${slug}`}>
          <h2 className="font-display text-xl leading-snug text-ink transition-opacity group-hover:opacity-70 sm:text-2xl">
            {title}
          </h2>
        </Link>

        <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-muted">
          {excerpt?.trim() ||
            'A new story from the magazine — open the piece to read the full article.'}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-ink/20 pt-4 text-xs text-muted">
          <div className="flex min-w-0 items-center gap-2">
            {authorSlug ? (
              <Link href={`/authors/${authorSlug}`} className="flex min-w-0 items-center gap-2 hover:opacity-70">
                <Avatar name={authorName} image={authorImage} size="sm" />
                <p>
                  <span className="text-muted/80">Text</span>{' '}
                  <span className="font-medium text-ink">
                    {authorName ?? 'Anonymous'}
                  </span>
                </p>
              </Link>
            ) : (
              <>
                <Avatar name={authorName} image={authorImage} size="sm" />
                <p>
                  <span className="text-muted/80">Text</span>{' '}
                  <span className="font-medium text-ink">
                    {authorName ?? 'Anonymous'}
                  </span>
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p>
              <span className="text-muted/80">Views</span>{' '}
              <span className="font-medium text-ink">
                {viewCount.toLocaleString()}
              </span>
            </p>
            <p>
              <span className="text-muted/80">Duration</span>{' '}
              <span className="font-medium text-ink">{minutes} Min</span>
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
