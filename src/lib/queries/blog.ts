import { cache } from 'react';
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  category,
  comment,
  content,
  contentCategory,
  reaction,
  user,
  type ReactionType,
} from '@/lib/db/schema';
import { publishDueScheduledPosts } from '@/lib/cms/publish-scheduled';
import { ensureCmsDefaults } from '@/lib/db/seed';

export type PaginatedPosts = {
  rows: Awaited<ReturnType<typeof getPublishedPosts>>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function normalizePage(page: number, pageSize: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return { totalPages, page: safePage };
}

const publishedPostSelect = {
  id: content.id,
  title: content.title,
  slug: content.slug,
  excerpt: content.excerpt,
  coverImage: content.coverImage,
  publishedAt: content.publishedAt,
  featured: content.featured,
  editorsPick: content.editorsPick,
  readingTime: content.readingTime,
  viewCount: content.viewCount,
  authorName: user.name,
  authorSlug: user.slug,
  authorImage: user.image,
  categoryName: category.name,
  categorySlug: category.slug,
} as const;

export async function getPublishedPosts() {
  await ensureCmsDefaults();
  await publishDueScheduledPosts();

  return db
    .select(publishedPostSelect)
    .from(content)
    .leftJoin(user, eq(content.createdBy, user.id))
    .leftJoin(category, eq(content.categoryId, category.id))
    .where(eq(content.status, 'published'))
    .orderBy(
      desc(content.publishedAt),
      desc(content.createdAt),
    );
}

export async function getPublishedPostsPage(options?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedPosts> {
  await ensureCmsDefaults();
  await publishDueScheduledPosts();

  const requestedPage = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, options?.pageSize ?? 12));
  const offset = (requestedPage - 1) * pageSize;

  const [totalRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(content)
      .where(eq(content.status, 'published'))
      .then((result) => result[0]),
    db
      .select(publishedPostSelect)
      .from(content)
      .leftJoin(user, eq(content.createdBy, user.id))
      .leftJoin(category, eq(content.categoryId, category.id))
      .where(eq(content.status, 'published'))
      .orderBy(
        desc(content.publishedAt),
        desc(content.createdAt),
      )
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = Number(totalRow?.value ?? 0);
  const { page, totalPages } = normalizePage(requestedPage, pageSize, total);

  return { rows, total, page, pageSize, totalPages };
}

export async function getPublishedPostsByCategory(categorySlug: string) {
  await ensureCmsDefaults();
  await publishDueScheduledPosts();

  return db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt,
      coverImage: content.coverImage,
      publishedAt: content.publishedAt,
      featured: content.featured,
      editorsPick: content.editorsPick,
      viewCount: content.viewCount,
      authorName: user.name,
      authorSlug: user.slug,
      categoryName: category.name,
      categorySlug: category.slug,
    })
    .from(content)
    .leftJoin(user, eq(content.createdBy, user.id))
    .innerJoin(
      contentCategory,
      eq(contentCategory.contentId, content.id),
    )
    .innerJoin(category, eq(contentCategory.categoryId, category.id))
    .where(
      and(eq(content.status, 'published'), eq(category.slug, categorySlug)),
    )
    .orderBy(desc(content.publishedAt));
}

export async function getPublishedPostsByCategoryPage(
  categorySlug: string,
  options?: { page?: number; pageSize?: number },
) {
  await ensureCmsDefaults();
  await publishDueScheduledPosts();

  const requestedPage = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, options?.pageSize ?? 12));
  const where = and(
    eq(content.status, 'published'),
    eq(category.slug, categorySlug),
  );
  const offset = (requestedPage - 1) * pageSize;

  const [totalRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(content)
      .innerJoin(
        contentCategory,
        eq(contentCategory.contentId, content.id),
      )
      .innerJoin(category, eq(contentCategory.categoryId, category.id))
      .where(where)
      .then((result) => result[0]),
    db
      .select({
        id: content.id,
        title: content.title,
        slug: content.slug,
        excerpt: content.excerpt,
        coverImage: content.coverImage,
        publishedAt: content.publishedAt,
        featured: content.featured,
        editorsPick: content.editorsPick,
        readingTime: content.readingTime,
        viewCount: content.viewCount,
        authorName: user.name,
        authorImage: user.image,
        authorSlug: user.slug,
        categoryName: category.name,
        categorySlug: category.slug,
      })
      .from(content)
      .leftJoin(user, eq(content.createdBy, user.id))
      .innerJoin(
        contentCategory,
        eq(contentCategory.contentId, content.id),
      )
      .innerJoin(category, eq(contentCategory.categoryId, category.id))
      .where(where)
      .orderBy(desc(content.publishedAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = Number(totalRow?.value ?? 0);
  const { page, totalPages } = normalizePage(requestedPage, pageSize, total);

  return { rows, total, page, pageSize, totalPages };
}


export const getPostBySlug = cache(async (slug: string) => {
  await publishDueScheduledPosts();

  const rows = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt,
      coverImage: content.coverImage,
      body: content.body,
      publishedAt: content.publishedAt,
      readingTime: content.readingTime,
      viewCount: content.viewCount,
      featured: content.featured,
      editorsPick: content.editorsPick,
      seoTitle: content.seoTitle,
      seoDescription: content.seoDescription,
      seoImage: content.seoImage,
      canonicalUrl: content.canonicalUrl,
      noIndex: content.noIndex,
      noFollow: content.noFollow,
      authorId: user.id,
      authorName: user.name,
      authorSlug: user.slug,
      authorImage: user.image,
      authorBio: user.bio,
      categoryName: category.name,
      categorySlug: category.slug,
    })
    .from(content)
    .leftJoin(user, eq(content.createdBy, user.id))
    .leftJoin(category, eq(content.categoryId, category.id))
    .where(and(eq(content.slug, slug), eq(content.status, 'published')))
    .limit(1);

  return rows[0] ?? null;
});

export async function getPostComments(contentId: string) {
  return db
    .select({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      userId: comment.userId,
      authorName: user.name,
      authorImage: user.image,
    })
    .from(comment)
    .innerJoin(user, eq(comment.userId, user.id))
    .where(and(eq(comment.contentId, contentId), eq(comment.status, 'approved')))
    .orderBy(desc(comment.createdAt));
}

export async function getPostReactions(contentId: string) {
  return db
    .select({
      type: reaction.type,
      count: count(),
    })
    .from(reaction)
    .where(eq(reaction.contentId, contentId))
    .groupBy(reaction.type);
}

export async function getUserReaction(contentId: string, userId: string) {
  const rows = await db
    .select({ type: reaction.type })
    .from(reaction)
    .where(
      and(eq(reaction.contentId, contentId), eq(reaction.userId, userId)),
    )
    .limit(1);

  return (rows[0]?.type as ReactionType | undefined) ?? null;
}

export async function getReactionSummariesForContents(contentIds: string[]) {
  if (contentIds.length === 0) {
    return new Map<string, { type: ReactionType; count: number }[]>();
  }

  const rows = await db
    .select({
      contentId: reaction.contentId,
      type: reaction.type,
      count: count(),
    })
    .from(reaction)
    .where(inArray(reaction.contentId, contentIds))
    .groupBy(reaction.contentId, reaction.type);

  const map = new Map<string, { type: ReactionType; count: number }[]>();
  for (const row of rows) {
    const list = map.get(row.contentId) ?? [];
    list.push({ type: row.type as ReactionType, count: Number(row.count) });
    map.set(row.contentId, list);
  }
  return map;
}

export async function getUserReactionsForContents(
  contentIds: string[],
  userId: string,
) {
  if (contentIds.length === 0) {
    return new Map<string, ReactionType>();
  }

  const rows = await db
    .select({
      contentId: reaction.contentId,
      type: reaction.type,
    })
    .from(reaction)
    .where(
      and(
        eq(reaction.userId, userId),
        inArray(reaction.contentId, contentIds),
      ),
    );

  return new Map(
    rows.map((row) => [row.contentId, row.type as ReactionType]),
  );
}

export async function listOwnPosts(userId: string) {
  return db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt,
      coverImage: content.coverImage,
      status: content.status,
      publishedAt: content.publishedAt,
      updatedAt: content.updatedAt,
      categoryName: category.name,
    })
    .from(content)
    .leftJoin(category, eq(content.categoryId, category.id))
    .where(eq(content.createdBy, userId))
    .orderBy(desc(content.createdAt), desc(content.updatedAt));
}

export async function getPostForEdit(id: string) {
  const rows = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt,
      coverImage: content.coverImage,
      body: content.body,
      status: content.status,
      createdBy: content.createdBy,
      categoryId: content.categoryId,
    })
    .from(content)
    .where(eq(content.id, id))
    .limit(1);

  const post = rows[0];
  if (!post) return null;

  const categories = await db
    .select({ id: contentCategory.categoryId })
    .from(contentCategory)
    .where(eq(contentCategory.contentId, id));

  const categoryIds =
    categories.length > 0
      ? categories.map((item) => item.id)
      : post.categoryId
        ? [post.categoryId]
        : [];

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    body: post.body,
    status: post.status,
    createdBy: post.createdBy,
    categoryIds,
  };
}
