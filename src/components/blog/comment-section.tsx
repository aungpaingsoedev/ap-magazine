'use client';

import { useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { addComment } from '@/actions/blog';
import { Avatar } from '@/components/ui/avatar';

type CommentItem = {
  id: string;
  body: string;
  createdAt: Date;
  authorName: string | null;
  authorImage: string | null;
};

type CommentSectionProps = {
  contentId: string;
  comments: CommentItem[];
  isSignedIn: boolean;
};

export function CommentSection({
  contentId,
  comments,
  isSignedIn,
}: CommentSectionProps) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await addComment(contentId, body);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setBody('');
      setError('Your comment is awaiting approval.');
    });
  }

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xs font-bold tracking-[0.2em] text-neutral-950 uppercase">
        Comments ({comments.length})
      </h2>

      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="border border-neutral-950 bg-neutral-950 px-4 py-2 text-xs font-semibold tracking-wide text-white uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {pending ? 'Posting...' : 'Post comment'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-neutral-500">Sign in to leave a comment.</p>
      )}

      <ul className="divide-y divide-neutral-200 border-t border-neutral-200">
        {comments.map((item) => (
          <li key={item.id} className="py-5">
            <div className="mb-2 flex items-center gap-3">
              <Avatar name={item.authorName} image={item.authorImage} size="sm" />
              <div>
                <p className="text-sm font-medium text-neutral-950">
                  {item.authorName ?? 'Anonymous'}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-700">
              {item.body}
            </p>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="py-5 text-sm text-neutral-500">
            No comments yet. Be the first!
          </li>
        )}
      </ul>
    </div>
  );
}
