'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteBlogPost } from '@/actions/blog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function DeletePostButton({
  postId,
  title,
}: {
  postId: string;
  title: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteBlogPost(postId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="sketch-btn px-4 py-2 text-center text-[10px] font-semibold tracking-wider uppercase text-coral"
        >
          Delete
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete post</DialogTitle>
          <DialogDescription>
            Delete “{title}”? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-coral">{error}</p> : null}
        <DialogFooter>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="sketch-btn px-4 py-2 text-xs font-semibold tracking-wider uppercase disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="sketch-btn-solid px-4 py-2 text-xs font-semibold tracking-wider uppercase disabled:opacity-40"
          >
            {pending ? 'Deleting…' : 'Delete'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
