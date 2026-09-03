'use server';

import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { fail, ok, publicError, type ActionResult } from '@/lib/action-result';

export async function recordPostView(
  contentId: string,
): Promise<ActionResult<{ viewCount: number }>> {
  try {
    const [updated] = await db
      .update(content)
      .set({
        viewCount: sql`${content.viewCount} + 1`,
      })
      .where(eq(content.id, contentId))
      .returning({ viewCount: content.viewCount });

    if (!updated) {
      return fail('Post not found');
    }

    return ok({ viewCount: updated.viewCount });
  } catch (err) {
    return fail(publicError(err, 'Failed to record view'));
  }
}
