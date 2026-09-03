'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, max, ne } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import {
  content,
  contentCategory,
  contentRevision,
  contentTag,
  type ContentStatus,
} from '@/lib/db/schema';
import { can, requirePermission, requireSession } from '@/lib/auth/session';
import { articleFormSchema } from '@/lib/validations/content';
import { estimateReadingMinutes } from '@/lib/blog-utils';
import { fail, ok, publicError, type ActionResult } from '@/lib/action-result';

function revalidateArticle(slug?: string) {
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/articles');
  revalidatePath('/admin/dashboard');
  revalidatePath('/feed.xml');
  if (slug) {
    revalidatePath(`/blog/${slug}`);
    revalidatePath('/admin/articles');
  }
}

function statusForIntent(
  intent: 'draft' | 'save' | 'review' | 'publish' | 'schedule',
  current?: ContentStatus,
): ContentStatus {
  if (intent === 'draft') return 'draft';
  if (intent === 'review') return 'review';
  if (intent === 'publish') return 'published';
  if (intent === 'schedule') return 'scheduled';
  return current ?? 'draft';
}

async function slugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const rows = await db
    .select({ id: content.id })
    .from(content)
    .where(
      excludeId
        ? and(eq(content.slug, slug), ne(content.id, excludeId))
        : eq(content.slug, slug),
    )
    .limit(1);
  return Boolean(rows[0]);
}

async function syncTags(contentId: string, tagIds: string[]) {
  await db.delete(contentTag).where(eq(contentTag.contentId, contentId));
  if (tagIds.length === 0) return;
  await db.insert(contentTag).values(
    tagIds.map((tagId) => ({
      contentId,
      tagId,
    })),
  );
}

async function syncCategories(contentId: string, categoryIds: string[]) {
  const unique = [...new Set(categoryIds.filter(Boolean))];
  await db
    .delete(contentCategory)
    .where(eq(contentCategory.contentId, contentId));
  if (unique.length === 0) return;
  await db.insert(contentCategory).values(
    unique.map((categoryId) => ({
      contentId,
      categoryId,
    })),
  );
}

async function saveRevision(article: {
  id: string;
  title: string;
  excerpt: string | null;
  body: typeof content.$inferSelect.body;
  userId: string;
}) {
  const [latest] = await db
    .select({ version: max(contentRevision.version) })
    .from(contentRevision)
    .where(eq(contentRevision.contentId, article.id));

  await db.insert(contentRevision).values({
    id: nanoid(),
    contentId: article.id,
    version: (latest?.version ?? 0) + 1,
    title: article.title,
    excerpt: article.excerpt,
    body: article.body,
    createdBy: article.userId,
    createdAt: new Date(),
  });
}

export async function saveArticle(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const session = await requirePermission('articles.create');
    const parsed = articleFormSchema.safeParse(input);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid article');
    }

    const data = parsed.data;
    const publishIntent = data.intent === 'publish' || data.intent === 'schedule';

    if (publishIntent && !can(session.user, 'articles.publish')) {
      return fail('You do not have permission to publish or schedule');
    }

    if (await slugTaken(data.slug, data.id)) {
      return fail('Slug is already in use');
    }

    const existing = data.id
      ? (
          await db
            .select()
            .from(content)
            .where(eq(content.id, data.id))
            .limit(1)
        )[0]
      : undefined;

    if (data.id && !existing) {
      return fail('Article not found');
    }

    const isOwner = existing?.createdBy === session.user.id;
    if (existing) {
      const canEdit =
        can(session.user, 'articles.update_any') ||
        (can(session.user, 'articles.update_own') && isOwner);
      if (!canEdit) {
        return fail('Forbidden: insufficient permissions');
      }
    }

    const now = new Date();
    const status = statusForIntent(data.intent, existing?.status);
    const readingTime = estimateReadingMinutes(data.excerpt, data.body);
    const categoryIds = [
      ...new Set(
        (data.categoryIds?.length
          ? data.categoryIds
          : data.categoryId
            ? [data.categoryId]
            : []
        ).filter(Boolean),
      ),
    ];
    const primaryCategoryId = categoryIds[0] ?? null;

    let publishedAt = existing?.publishedAt ?? null;
    let scheduledAt = existing?.scheduledAt ?? null;

    if (status === 'published') {
      publishedAt = now;
      scheduledAt = null;
    } else if (status === 'scheduled' && data.publishedAt) {
      publishedAt = new Date(data.publishedAt);
      scheduledAt = publishedAt;
    }

    const authorId = can(session.user, 'articles.update_any')
      ? (data.authorId || existing?.createdBy || session.user.id)
      : (existing?.createdBy || session.user.id);

    const featured = can(session.user, 'articles.publish')
      ? Boolean(data.featured)
      : (existing?.featured ?? false);
    const editorsPick = can(session.user, 'articles.publish')
      ? Boolean(data.editorsPick)
      : (existing?.editorsPick ?? false);

    const values = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      coverImage: data.coverImage || null,
      body: data.body,
      status,
      featured,
      editorsPick,
      displayOrder: data.displayOrder ?? 0,
      readingTime,
      categoryId: primaryCategoryId,
      publishedAt,
      scheduledAt,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      seoImage: data.seoImage || null,
      canonicalUrl: data.canonicalUrl || null,
      noIndex: Boolean(data.noIndex),
      noFollow: Boolean(data.noFollow),
      updatedAt: now,
      updatedBy: session.user.id,
    };

    const id = existing?.id ?? nanoid();

    if (existing) {
      await saveRevision({
        id: existing.id,
        title: existing.title,
        excerpt: existing.excerpt,
        body: existing.body,
        userId: session.user.id,
      });

      await db.update(content).set(values).where(eq(content.id, existing.id));
    } else {
      await db.insert(content).values({
        id,
        ...values,
        createdAt: now,
        createdBy: authorId,
      });
    }

    await syncCategories(id, categoryIds);
    await syncTags(id, data.tagIds ?? []);
    revalidateArticle(data.slug);

    if (status === 'published') {
      const { broadcastPublishedPost } = await import('@/lib/realtime/broadcast');
      await broadcastPublishedPost(id);
    }

    return ok({ id, slug: data.slug });
  } catch (err) {
    return fail(publicError(err, 'Failed to save article'));
  }
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  try {
    await requirePermission('articles.delete');
    const [article] = await db
      .select({ slug: content.slug })
      .from(content)
      .where(eq(content.id, id))
      .limit(1);

    if (!article) return fail('Article not found');

    await db.delete(content).where(eq(content.id, id));
    revalidateArticle(article.slug);
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to delete article'));
  }
}

export async function setArticleStatus(
  id: string,
  status: ContentStatus,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const [article] = await db.select().from(content).where(eq(content.id, id)).limit(1);
    if (!article) return fail('Article not found');

    if (status === 'published' || status === 'scheduled' || status === 'archived') {
      if (!can(session.user, 'articles.publish') && status !== 'archived') {
        return fail('Forbidden: insufficient permissions');
      }
      if (status === 'archived' && !can(session.user, 'articles.delete') && article.createdBy !== session.user.id) {
        return fail('Forbidden: insufficient permissions');
      }
    }

    const now = new Date();
    await db
      .update(content)
      .set({
        status,
        publishedAt:
          status === 'published' ? now : article.publishedAt,
        updatedAt: now,
        updatedBy: session.user.id,
      })
      .where(eq(content.id, id));

    revalidateArticle(article.slug);

    if (status === 'published') {
      const { broadcastPublishedPost } = await import('@/lib/realtime/broadcast');
      await broadcastPublishedPost(id);
    }

    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to update status'));
  }
}

export async function toggleArticleFlag(
  id: string,
  field: 'featured' | 'editorsPick',
): Promise<ActionResult> {
  try {
    await requirePermission('articles.publish');
    const [article] = await db.select().from(content).where(eq(content.id, id)).limit(1);
    if (!article) return fail('Article not found');

    await db
      .update(content)
      .set({
        [field]: !article[field],
        updatedAt: new Date(),
      })
      .where(eq(content.id, id));

    revalidateArticle(article.slug);
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to update article'));
  }
}

export async function restoreRevision(
  contentId: string,
  revisionId: string,
): Promise<ActionResult> {
  try {
    const session = await requirePermission('articles.update_any');
    const [revision] = await db
      .select()
      .from(contentRevision)
      .where(
        and(
          eq(contentRevision.id, revisionId),
          eq(contentRevision.contentId, contentId),
        ),
      )
      .limit(1);

    if (!revision) return fail('Revision not found');

    const [article] = await db
      .select()
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);
    if (!article) return fail('Article not found');

    await saveRevision({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      body: article.body,
      userId: session.user.id,
    });

    await db
      .update(content)
      .set({
        title: revision.title,
        excerpt: revision.excerpt,
        body: revision.body,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      })
      .where(eq(content.id, contentId));

    revalidateArticle(article.slug);
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to restore revision'));
  }
}
