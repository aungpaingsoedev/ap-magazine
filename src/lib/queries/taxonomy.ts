import { cache } from 'react';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  category,
  contentCategory,
  contentTag,
  siteSettings,
  tag,
} from '@/lib/db/schema';
import { ensureCmsDefaults } from '@/lib/db/seed';

export const getActiveCategories = cache(async () => {
  await ensureCmsDefaults();
  return db
    .select()
    .from(category)
    .where(eq(category.active, true))
    .orderBy(asc(category.sortOrder), asc(category.name));
});

export async function getAllCategories() {
  await ensureCmsDefaults();
  return db
    .select()
    .from(category)
    .orderBy(asc(category.sortOrder), asc(category.name));
}

export async function getCategoryBySlug(slug: string) {
  await ensureCmsDefaults();
  const rows = await db
    .select()
    .from(category)
    .where(eq(category.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAllTags() {
  return db.select().from(tag).orderBy(asc(tag.name));
}

export async function getArticleTags(contentId: string) {
  return db
    .select({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })
    .from(contentTag)
    .innerJoin(tag, eq(contentTag.tagId, tag.id))
    .where(eq(contentTag.contentId, contentId));
}

export async function getArticleCategories(contentId: string) {
  return db
    .select({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })
    .from(contentCategory)
    .innerJoin(category, eq(contentCategory.categoryId, category.id))
    .where(eq(contentCategory.contentId, contentId))
    .orderBy(asc(category.sortOrder), asc(category.name));
}

export const getSiteSettings = cache(async () => {
  try {
    await ensureCmsDefaults();
    const rows = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, 'default'))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    // Build/prerender may run before schema exists
    return null;
  }
});
