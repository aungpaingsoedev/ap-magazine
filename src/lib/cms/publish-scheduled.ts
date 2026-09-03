import { and, eq, lte, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { broadcastPublishedPost } from '@/lib/realtime/broadcast';

/** Publishes scheduled articles whose go-live time has passed. */
export async function publishDueScheduledPosts(): Promise<number> {
  const now = new Date();

  const due = await db
    .update(content)
    .set({
      status: 'published',
      publishedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(content.status, 'scheduled'),
        or(
          lte(content.scheduledAt, now),
          lte(content.publishedAt, now),
        ),
      ),
    )
    .returning({ id: content.id });

  await Promise.all(due.map((row) => broadcastPublishedPost(row.id)));

  return due.length;
}
