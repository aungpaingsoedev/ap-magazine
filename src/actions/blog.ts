'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { category, comment, content, contentCategory, reaction } from '@/lib/db/schema';
import { can, requirePermission, requireSession } from '@/lib/auth/session';
import {
  blogPostSchema,
  commentSchema,
  reactionTypeSchema,
  type BlogPostValues,
} from '@/lib/validations/blog';
import type { ReactionType } from '@/lib/db/schema';
import { slugify } from '@/lib/slug';
import { estimateReadingMinutes } from '@/lib/blog-utils';
import { fail, ok, publicError, type ActionResult } from '@/lib/action-result';
import { ensureCmsDefaults } from '@/lib/db/seed';

export type { ActionResult };

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || 'article';
  let suffix = 1;

  while (true) {
    const existing = await db
      .select({ id: content.id })
      .from(content)
      .where(eq(content.slug, slug))
      .limit(1);

    if (!existing[0]) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function createBlogPost(
  input: BlogPostValues,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const session = await requirePermission('articles.create');
    const parsed = blogPostSchema.safeParse(input);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    await ensureCmsDefaults();

    const id = nanoid();
    const now = new Date();
    const slug = await uniqueSlug(slugify(parsed.data.title));
    const canPublish = can(session.user, 'articles.publish');

    const requested = [...new Set(parsed.data.categoryIds)];
    const selected = await db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.active, true));

    const activeIds = new Set(selected.map((item) => item.id));
    const categoryIds = requested.filter((id) => activeIds.has(id));

    if (categoryIds.length === 0) {
      return fail('Choose at least one valid category');
    }

    const primaryCategoryId = categoryIds[0];

    await db.insert(content).values({
      id,
      title: parsed.data.title,
      slug,
      excerpt: parsed.data.excerpt,
      coverImage: parsed.data.coverImage,
      body: parsed.data.body,
      status: canPublish ? 'published' : 'draft',
      publishedAt: canPublish ? now : null,
      categoryId: primaryCategoryId,
      readingTime: estimateReadingMinutes(parsed.data.excerpt, parsed.data.body),
      createdBy: session.user.id,
      updatedBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(contentCategory).values(
      categoryIds.map((categoryId) => ({
        contentId: id,
        categoryId,
      })),
    );

    if (canPublish) {
      const { broadcastPublishedPost } = await import('@/lib/realtime/broadcast');
      await broadcastPublishedPost(id);
    }

    revalidatePath('/');
    revalidatePath('/admin/articles');
    return ok({ slug });
  } catch (err) {
    return fail(publicError(err, 'Failed to publish post'));
  }
}

export async function addComment(
  contentId: string,
  body: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    const parsed = commentSchema.safeParse({ body });

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid comment');
    }

    const post = await db
      .select({ slug: content.slug })
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (!post[0]) {
      return fail('Post not found');
    }

    const id = nanoid();
    const now = new Date();

    await db.insert(comment).values({
      id,
      contentId,
      userId: session.user.id,
      body: parsed.data.body,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath(`/blog/${post[0].slug}`);
    revalidatePath('/admin/comments');
    return ok({ id });
  } catch (err) {
    return fail(publicError(err, 'Failed to add comment'));
  }
}

export async function setReaction(
  contentId: string,
  type: ReactionType,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const parsed = reactionTypeSchema.safeParse(type);

    if (!parsed.success) {
      return fail('Invalid reaction');
    }

    const post = await db
      .select({ slug: content.slug })
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (!post[0]) {
      return fail('Post not found');
    }

    const existing = await db
      .select({ id: reaction.id, type: reaction.type })
      .from(reaction)
      .where(
        and(
          eq(reaction.contentId, contentId),
          eq(reaction.userId, session.user.id),
        ),
      )
      .limit(1);

    if (existing[0]) {
      if (existing[0].type === parsed.data) {
        await db.delete(reaction).where(eq(reaction.id, existing[0].id));
      } else {
        await db
          .update(reaction)
          .set({ type: parsed.data })
          .where(eq(reaction.id, existing[0].id));
      }
    } else {
      await db.insert(reaction).values({
        id: nanoid(),
        contentId,
        userId: session.user.id,
        type: parsed.data,
        createdAt: new Date(),
      });
    }

    revalidatePath(`/blog/${post[0].slug}`);
    revalidatePath('/');
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to react'));
  }
}
