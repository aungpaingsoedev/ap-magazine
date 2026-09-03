'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { comment, type CommentStatus } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { fail, ok, publicError, type ActionResult } from '@/lib/action-result';

export async function moderateComment(
  id: string,
  status: CommentStatus,
): Promise<ActionResult> {
  try {
    await requirePermission('comments.moderate');
    await db
      .update(comment)
      .set({ status, updatedAt: new Date() })
      .where(eq(comment.id, id));

    revalidatePath('/admin/comments');
    revalidatePath('/');
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to moderate comment'));
  }
}

export async function deleteComment(id: string): Promise<ActionResult> {
  try {
    await requirePermission('comments.moderate');
    await db.delete(comment).where(eq(comment.id, id));
    revalidatePath('/admin/comments');
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to delete comment'));
  }
}
