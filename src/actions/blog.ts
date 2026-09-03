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
import { searchPublishedArticles } from '@/lib/queries/admin';

export type { ActionResult };

async function uniqueSlug(base: string): Promise<string> {
  const safeBase = base || 'article';
  let slug = safeBase;
  let suffix = 1;

  while (true) {
    const existing = await db
      .select({ id: content.id })
      .from(content)
      .where(eq(content.slug, slug))
      .limit(1);

    if (!existing[0]) return slug;
    slug = `${safeBase}-${suffix}`;
    suffix += 1;
  }
}

export async function createBlogPost(
  input: BlogPostValues,
): Promise<ActionResult<{ slug: string; published: boolean }>> {
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
    const isPublic = parsed.data.publish;

    await db.insert(content).values({
      id,
      title: parsed.data.title,
      slug,
      excerpt: parsed.data.excerpt,
      coverImage: parsed.data.coverImage,
      body: parsed.data.body,
      status: isPublic ? 'published' : 'draft',
      publishedAt: isPublic ? now : null,
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

    if (isPublic) {
      const { broadcastPublishedPost } = await import('@/lib/realtime/broadcast');
      await broadcastPublishedPost(id);
    }

    revalidatePath('/');
    revalidatePath(`/blog/${slug}`);
    revalidatePath('/admin/articles');
    revalidatePath('/posts');
    return ok({ slug, published: isPublic });
  } catch (err) {
    return fail(publicError(err, 'Failed to save post'));
  }
}

export async function updateBlogPost(
  id: string,
  input: BlogPostValues,
): Promise<ActionResult<{ slug: string; published: boolean }>> {
  try {
    const session = await requireSession();
    const parsed = blogPostSchema.safeParse(input);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const existing = (
      await db.select().from(content).where(eq(content.id, id)).limit(1)
    )[0];

    if (!existing) {
      return fail('Post not found');
    }

    const canEdit =
      can(session.user, 'articles.update_any') ||
      (can(session.user, 'articles.update_own') &&
        existing.createdBy === session.user.id);

    if (!canEdit) {
      return fail('Forbidden: insufficient permissions');
    }

    const requested = [...new Set(parsed.data.categoryIds)];
    const selected = await db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.active, true));

    const activeIds = new Set(selected.map((item) => item.id));
    const categoryIds = requested.filter((itemId) => activeIds.has(itemId));

    if (categoryIds.length === 0) {
      return fail('Choose at least one valid category');
    }

    const now = new Date();
    const isPublic = parsed.data.publish;
    const wasPublic = existing.status === 'published';
    const publishedAt = isPublic
      ? existing.publishedAt ?? now
      : null;

    await db
      .update(content)
      .set({
        title: parsed.data.title,
        excerpt: parsed.data.excerpt,
        coverImage: parsed.data.coverImage,
        body: parsed.data.body,
        status: isPublic ? 'published' : 'draft',
        publishedAt,
        categoryId: categoryIds[0],
        readingTime: estimateReadingMinutes(
          parsed.data.excerpt,
          parsed.data.body,
        ),
        updatedBy: session.user.id,
        updatedAt: now,
      })
      .where(eq(content.id, id));

    await db
      .delete(contentCategory)
      .where(eq(contentCategory.contentId, id));

    await db.insert(contentCategory).values(
      categoryIds.map((categoryId) => ({
        contentId: id,
        categoryId,
      })),
    );

    if (isPublic && !wasPublic) {
      const { broadcastPublishedPost } = await import('@/lib/realtime/broadcast');
      await broadcastPublishedPost(id);
    }

    revalidatePath('/');
    revalidatePath(`/blog/${existing.slug}`);
    revalidatePath('/admin/articles');
    revalidatePath('/posts');
    revalidatePath(`/write/${id}`);
    return ok({ slug: existing.slug, published: isPublic });
  } catch (err) {
    return fail(publicError(err, 'Failed to update post'));
  }
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const existing = (
      await db
        .select({
          id: content.id,
          slug: content.slug,
          createdBy: content.createdBy,
        })
        .from(content)
        .where(eq(content.id, id))
        .limit(1)
    )[0];

    if (!existing) {
      return fail('Post not found');
    }

    const canDelete =
      can(session.user, 'articles.delete') ||
      (can(session.user, 'articles.update_own') &&
        existing.createdBy === session.user.id);

    if (!canDelete) {
      return fail('Forbidden: insufficient permissions');
    }

    await db.delete(content).where(eq(content.id, id));

    revalidatePath('/');
    revalidatePath(`/blog/${existing.slug}`);
    revalidatePath('/admin/articles');
    revalidatePath('/posts');
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to delete post'));
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
      status: 'approved',
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

export async function updateOwnComment(
  commentId: string,
  body: string,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const parsed = commentSchema.safeParse({ body });

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid comment');
    }

    const [existing] = await db
      .select({
        id: comment.id,
        userId: comment.userId,
        slug: content.slug,
      })
      .from(comment)
      .innerJoin(content, eq(comment.contentId, content.id))
      .where(eq(comment.id, commentId))
      .limit(1);

    if (!existing) {
      return fail('Comment not found');
    }

    if (existing.userId !== session.user.id) {
      return fail('You can only edit your own comments');
    }

    await db
      .update(comment)
      .set({
        body: parsed.data.body,
        updatedAt: new Date(),
      })
      .where(eq(comment.id, commentId));

    revalidatePath(`/blog/${existing.slug}`);
    revalidatePath('/admin/comments');
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to update comment'));
  }
}

export async function deleteOwnComment(
  commentId: string,
): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const [existing] = await db
      .select({
        id: comment.id,
        userId: comment.userId,
        slug: content.slug,
      })
      .from(comment)
      .innerJoin(content, eq(comment.contentId, content.id))
      .where(eq(comment.id, commentId))
      .limit(1);

    if (!existing) {
      return fail('Comment not found');
    }

    if (existing.userId !== session.user.id) {
      return fail('You can only delete your own comments');
    }

    await db.delete(comment).where(eq(comment.id, commentId));

    revalidatePath(`/blog/${existing.slug}`);
    revalidatePath('/admin/comments');
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to delete comment'));
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

export type SearchArticleHit = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  categoryName: string | null;
  authorName: string | null;
};

export async function searchArticles(q: string): Promise<SearchArticleHit[]> {
  const term = q.trim();
  if (!term) return [];

  const rows = await searchPublishedArticles(term);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    categoryName: row.categoryName,
    authorName: row.authorName,
  }));
}
