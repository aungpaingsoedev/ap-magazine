import { and, eq, lte, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';

let lastCheckAt = 0;
const CHECK_INTERVAL_MS = 60_000;

/** Publishes scheduled articles whose go-live time has passed. */
export async function publishDueScheduledPosts(
  options?: { force?: boolean },
): Promise<number> {
  const nowMs = Date.now();
  if (!options?.force && nowMs - lastCheckAt < CHECK_INTERVAL_MS) return 0;
  lastCheckAt = nowMs;

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

  return due.length;
}
