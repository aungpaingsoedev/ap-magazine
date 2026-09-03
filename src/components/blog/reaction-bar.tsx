'use client';

import { useEffect, useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { setReaction } from '@/actions/blog';
import { cn } from '@/lib/utils';
import type { ReactionType } from '@/lib/db/schema';

const HEART: ReactionType = 'love';

type ReactionBarProps = {
  contentId: string;
  counts: { type: ReactionType; count: number }[];
  userReaction: ReactionType | null;
  isSignedIn: boolean;
  variant?: 'default' | 'compact';
};

export function ReactionBar({
  contentId,
  counts,
  userReaction,
  isSignedIn,
  variant = 'default',
}: ReactionBarProps) {
  const [pending, startTransition] = useTransition();
  const [liked, setLiked] = useState(userReaction === HEART);
  const [total, setTotal] = useState(
    counts.find((item) => item.type === HEART)?.count ?? 0,
  );
  const compact = variant === 'compact';

  useEffect(() => {
    setLiked(userReaction === HEART);
  }, [userReaction]);

  useEffect(() => {
    setTotal(counts.find((item) => item.type === HEART)?.count ?? 0);
  }, [counts]);

  function handleToggle(event?: React.MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!isSignedIn || pending) return;

    setLiked((prev) => {
      setTotal((count) => Math.max(0, count + (prev ? -1 : 1)));
      return !prev;
    });

    startTransition(async () => {
      await setReaction(contentId, HEART);
    });
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        !compact && 'space-y-0',
      )}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {!compact && (
        <p className="sr-only">React</p>
      )}

      <button
        type="button"
        disabled={!isSignedIn || pending}
        onClick={handleToggle}
        aria-pressed={liked}
        aria-label={liked ? 'Remove heart' : 'Give heart'}
        title={isSignedIn ? (liked ? 'Unlike' : 'Heart') : 'Sign in to react'}
        className={cn(
          'inline-flex items-center gap-2 border border-neutral-950 transition-colors',
          compact ? 'px-2.5 py-1.5' : 'px-4 py-2.5',
          liked
            ? 'bg-neutral-950 text-white'
            : 'bg-white text-neutral-950 hover:bg-neutral-100',
          !isSignedIn && 'cursor-not-allowed opacity-40',
        )}
      >
        <Heart
          className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')}
          fill={liked ? 'currentColor' : 'none'}
          strokeWidth={1.75}
        />
        {total > 0 ? (
          <span
            className={cn(
              'font-semibold tracking-wide',
              compact ? 'text-[10px]' : 'text-xs',
            )}
          >
            {total}
          </span>
        ) : null}
      </button>

      {!isSignedIn && !compact && (
        <p className="text-xs text-neutral-500">Sign in to react to this post.</p>
      )}
    </div>
  );
}
