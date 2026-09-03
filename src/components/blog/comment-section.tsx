'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  addComment,
  deleteOwnComment,
  updateOwnComment,
} from '@/actions/blog';
import { Avatar } from '@/components/ui/avatar';

type CommentItem = {
  id: string;
  body: string;
  createdAt: Date;
  userId: string;
  authorName: string | null;
  authorImage: string | null;
};

type CommentSectionProps = {
  contentId: string;
  comments: CommentItem[];
  isSignedIn: boolean;
  currentUserId?: string | null;
};

export function CommentSection({
  contentId,
  comments,
  isSignedIn,
  currentUserId = null,
}: CommentSectionProps) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [itemError, setItemError] = useState<string | null>(null);
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
      router.refresh();
    });
  }

  function startEdit(item: CommentItem) {
    setItemError(null);
    setEditingId(item.id);
    setEditBody(item.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditBody('');
    setItemError(null);
  }

  function saveEdit(commentId: string) {
    setItemError(null);
    startTransition(async () => {
      const result = await updateOwnComment(commentId, editBody);
      if (!result.success) {
        setItemError(result.error);
        return;
      }
      setEditingId(null);
      setEditBody('');
      router.refresh();
    });
  }

  function removeComment(commentId: string) {
    if (!window.confirm('Delete this comment?')) return;
    setItemError(null);
    startTransition(async () => {
      const result = await deleteOwnComment(commentId);
      if (!result.success) {
        setItemError(result.error);
        return;
      }
      if (editingId === commentId) {
        cancelEdit();
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xs font-bold tracking-[0.2em] text-ink uppercase">
        Comments ({comments.length})
      </h2>

      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full border-2 border-ink/30 bg-[color-mix(in_srgb,var(--paper)_90%,white)] px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />
          {error && <p className="text-sm text-coral">{error}</p>}
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="sketch-btn-solid px-4 py-2 text-xs font-semibold tracking-wide uppercase disabled:opacity-40"
          >
            {pending ? 'Posting...' : 'Post comment'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted">Sign in to leave a comment.</p>
      )}

      {itemError ? <p className="text-sm text-coral">{itemError}</p> : null}

      <ul className="divide-y-2 divide-dashed divide-ink/20 border-t-2 border-dashed border-ink/30">
        {comments.map((item) => {
          const isOwner = Boolean(currentUserId && item.userId === currentUserId);
          const isEditing = editingId === item.id;

          return (
            <li key={item.id} className="py-5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={item.authorName} image={item.authorImage} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {item.authorName ?? 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {isOwner && !isEditing ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => startEdit(item)}
                      className="text-[10px] font-semibold tracking-wider uppercase text-ink underline decoration-dashed underline-offset-4 disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => removeComment(item.id)}
                      className="text-[10px] font-semibold tracking-wider uppercase text-coral underline decoration-dashed underline-offset-4 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editBody}
                    onChange={(event) => setEditBody(event.target.value)}
                    rows={3}
                    className="w-full border-2 border-ink/30 bg-[color-mix(in_srgb,var(--paper)_90%,white)] px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending || !editBody.trim()}
                      onClick={() => saveEdit(item.id)}
                      className="sketch-btn-solid px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase disabled:opacity-40"
                    >
                      {pending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={cancelEdit}
                      className="sketch-btn px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-charcoal">
                  {item.body}
                </p>
              )}
            </li>
          );
        })}
        {comments.length === 0 && (
          <li className="py-5 text-sm text-muted">
            No comments yet. Be the first!
          </li>
        )}
      </ul>
    </div>
  );
}
