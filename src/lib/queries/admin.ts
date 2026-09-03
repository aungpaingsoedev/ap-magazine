import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  category,
  comment,
  content,
  contentRevision,
  media,
  user,
  type ContentStatus,
} from '@/lib/db/schema';
import { ensureCmsDefaults } from '@/lib/db/seed';
import { getArticleCategories, getArticleTags } from '@/lib/queries/taxonomy';
import { publishDueScheduledPosts } from '@/lib/cms/publish-scheduled';

export type ArticleListFilters = {
  q?: string;
  status?: ContentStatus | 'all';
  categoryId?: string;
  authorId?: string;
  from?: string;
  to?: string;
  sort?: 'updated' | 'published' | 'title';
  page?: number;
  pageSize?: number;
};

export async function listAdminArticles(filters: ArticleListFilters) {
  await ensureCmsDefaults();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));
  const conditions = [];

  if (filters.q) {
    const term = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(content.title, term),
        ilike(content.slug, term),
        ilike(content.excerpt, term),
        ilike(user.name, term),
        ilike(category.name, term),
      ),
    );
  }

  if (filters.status && filters.status !== 'all') {
    conditions.push(eq(content.status, filters.status));
  }
  if (filters.categoryId) {
    conditions.push(eq(content.categoryId, filters.categoryId));
  }
  if (filters.authorId) {
    conditions.push(eq(content.createdBy, filters.authorId));
  }
  if (filters.from) {
    conditions.push(sql`${content.publishedAt} >= ${new Date(filters.from)}`);
  }
  if (filters.to) {
    conditions.push(sql`${content.publishedAt} <= ${new Date(filters.to)}`);
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const orderBy =
    filters.sort === 'title'
      ? asc(content.title)
      : filters.sort === 'published'
        ? desc(content.publishedAt)
        : desc(content.updatedAt);

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: content.id,
        title: content.title,
        slug: content.slug,
        status: content.status,
        featured: content.featured,
        publishedAt: content.publishedAt,
        updatedAt: content.updatedAt,
        authorName: user.name,
        categoryName: category.name,
      })
      .from(content)
      .leftJoin(user, eq(content.createdBy, user.id))
      .leftJoin(category, eq(content.categoryId, category.id))
      .where(where)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ value: count() })
      .from(content)
      .leftJoin(user, eq(content.createdBy, user.id))
      .leftJoin(category, eq(content.categoryId, category.id))
      .where(where),
  ]);

  return {
    rows,
    total: Number(totalRows[0]?.value ?? 0),
    page,
    pageSize,
  };
}

export async function getAdminArticle(id: string) {
  const rows = await db
    .select()
    .from(content)
    .where(eq(content.id, id))
    .limit(1);

  const article = rows[0];
  if (!article) return null;

  const [tags, categories] = await Promise.all([
    getArticleTags(id),
    getArticleCategories(id),
  ]);

  const categoryIds =
    categories.length > 0
      ? categories.map((item) => item.id)
      : article.categoryId
        ? [article.categoryId]
        : [];

  return {
    ...article,
    tagIds: tags.map((item) => item.id),
    tags,
    categoryIds,
    categories,
  };
}

export async function getArticleRevisions(contentId: string) {
  return db
    .select({
      id: contentRevision.id,
      version: contentRevision.version,
      title: contentRevision.title,
      excerpt: contentRevision.excerpt,
      createdAt: contentRevision.createdAt,
      editorName: user.name,
    })
    .from(contentRevision)
    .leftJoin(user, eq(contentRevision.createdBy, user.id))
    .where(eq(contentRevision.contentId, contentId))
    .orderBy(desc(contentRevision.version));
}

export async function getDashboardStats() {
  await ensureCmsDefaults();

  const [articles, published, drafts, scheduled, authors, categories] =
    await Promise.all([
      db.select({ value: count() }).from(content),
      db
        .select({ value: count() })
        .from(content)
        .where(eq(content.status, 'published')),
      db
        .select({ value: count() })
        .from(content)
        .where(eq(content.status, 'draft')),
      db
        .select({ value: count() })
        .from(content)
        .where(eq(content.status, 'scheduled')),
      db.select({ value: count() }).from(user).where(eq(user.active, true)),
      db.select({ value: count() }).from(category),
    ]);

  const recent = await db
    .select({
      id: content.id,
      title: content.title,
      status: content.status,
      updatedAt: content.updatedAt,
      authorName: user.name,
    })
    .from(content)
    .leftJoin(user, eq(content.createdBy, user.id))
    .orderBy(desc(content.updatedAt))
    .limit(8);

  return {
    totalArticles: Number(articles[0]?.value ?? 0),
    published: Number(published[0]?.value ?? 0),
    drafts: Number(drafts[0]?.value ?? 0),
    scheduled: Number(scheduled[0]?.value ?? 0),
    authors: Number(authors[0]?.value ?? 0),
    categories: Number(categories[0]?.value ?? 0),
    recent,
  };
}

export async function listAuthors() {
  return db.select().from(user).orderBy(asc(user.name));
}

export async function getAuthorBySlug(slug: string) {
  const rows = await db
    .select()
    .from(user)
    .where(and(eq(user.slug, slug), eq(user.active, true)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAuthorArticles(
  authorId: string,
  options?: { page?: number; pageSize?: number },
) {
  await publishDueScheduledPosts();

  const requestedPage = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, options?.pageSize ?? 12));
  const where = and(
    eq(content.createdBy, authorId),
    eq(content.status, 'published'),
  );

  const offset = (requestedPage - 1) * pageSize;

  const [totalRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(content)
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
        readingTime: content.readingTime,
        viewCount: content.viewCount,
        categoryName: category.name,
      })
      .from(content)
      .leftJoin(category, eq(content.categoryId, category.id))
      .where(where)
      .orderBy(desc(content.publishedAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = Number(totalRow?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);

  return { rows, total, page, pageSize, totalPages };
}

export async function listMedia(q?: string) {
  const where = q
    ? or(ilike(media.filename, `%${q}%`), ilike(media.alt, `%${q}%`))
    : undefined;

  return db
    .select()
    .from(media)
    .where(where)
    .orderBy(desc(media.createdAt));
}

export async function listAdminComments(status?: string) {
  const where =
    status && status !== 'all'
      ? eq(comment.status, status as 'pending' | 'approved' | 'rejected' | 'spam')
      : undefined;

  return db
    .select({
      id: comment.id,
      body: comment.body,
      status: comment.status,
      createdAt: comment.createdAt,
      authorName: user.name,
      articleTitle: content.title,
      articleSlug: content.slug,
    })
    .from(comment)
    .innerJoin(user, eq(comment.userId, user.id))
    .innerJoin(content, eq(comment.contentId, content.id))
    .where(where)
    .orderBy(desc(comment.createdAt));
}

export async function searchPublishedArticles(q: string) {
  await publishDueScheduledPosts();
  const term = `%${q}%`;

  return db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt,
      coverImage: content.coverImage,
      publishedAt: content.publishedAt,
      viewCount: content.viewCount,
      authorName: user.name,
      authorImage: user.image,
      authorSlug: user.slug,
      categoryName: category.name,
    })
    .from(content)
    .leftJoin(user, eq(content.createdBy, user.id))
    .leftJoin(category, eq(content.categoryId, category.id))
    .where(
      and(
        eq(content.status, 'published'),
        or(
          ilike(content.title, term),
          ilike(content.slug, term),
          ilike(content.excerpt, term),
          ilike(user.name, term),
          ilike(category.name, term),
        ),
      ),
    )
    .orderBy(desc(content.publishedAt))
    .limit(40);
}

export async function listArticleSlugs() {
  await publishDueScheduledPosts();
  return db
    .select({ slug: content.slug, updatedAt: content.updatedAt })
    .from(content)
    .where(eq(content.status, 'published'));
}
