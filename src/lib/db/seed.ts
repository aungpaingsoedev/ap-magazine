import { nanoid } from 'nanoid';
import { eq, isNull, sql, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  category,
  content,
  contentCategory,
  siteSettings,
  user,
} from '@/lib/db/schema';
import { slugify } from '@/lib/slug';
import { magazineCategory } from '@/lib/blog-utils';

const DEFAULT_CATEGORIES = [
  { name: 'Art', slug: 'art', sortOrder: 1 },
  { name: 'Culture', slug: 'culture', sortOrder: 2 },
  { name: 'Design', slug: 'design', sortOrder: 3 },
  { name: 'Essay', slug: 'essay', sortOrder: 4 },
] as const;

let seeding: Promise<void> | null = null;

export async function ensureCmsDefaults(): Promise<void> {
  if (!seeding) {
    seeding = seedCms().finally(() => {
      seeding = null;
    });
  }
  await seeding;
}

async function seedCms(): Promise<void> {
  const [existingSettings] = await db
    .select({ id: siteSettings.id })
    .from(siteSettings)
    .where(eq(siteSettings.id, 'default'))
    .limit(1);

  if (!existingSettings) {
    await db.insert(siteSettings).values({
      id: 'default',
      siteName: 'AP Magazine',
      description: 'Stories, essays, and culture from the community',
      homepageHeadline: 'Magazine',
      footerText: 'AP Magazine',
      articlesPerPage: 12,
      defaultSeoTitle: 'AP Magazine',
      defaultSeoDescription: 'Stories, essays, and culture from the community',
      updatedAt: new Date(),
    });
  } else {
    await db
      .update(siteSettings)
      .set({
        siteName: 'AP Magazine',
        footerText: 'AP Magazine',
        defaultSeoTitle: 'AP Magazine',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(siteSettings.id, 'default'),
          eq(siteSettings.siteName, 'Atlas Magazine'),
        ),
      );
  }

  const existingCategories = await db.select({ slug: category.slug }).from(category);
  const have = new Set(existingCategories.map((row) => row.slug));
  const now = new Date();

  for (const item of DEFAULT_CATEGORIES) {
    if (have.has(item.slug)) continue;
    await db.insert(category).values({
      id: nanoid(),
      name: item.name,
      slug: item.slug,
      sortOrder: item.sortOrder,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  const categories = await db.select().from(category);
  const byName = new Map(categories.map((row) => [row.name.toLowerCase(), row.id]));

  const uncategorized = await db
    .select({ id: content.id, slug: content.slug })
    .from(content)
    .where(isNull(content.categoryId));

  for (const post of uncategorized) {
    const label = magazineCategory(post.slug).toLowerCase();
    const categoryId = byName.get(label);
    if (!categoryId) continue;
    await db.update(content).set({ categoryId }).where(eq(content.id, post.id));
  }

  // Backfill junction rows from primary category_id (no-op if table missing)
  try {
    await db.execute(sql`
      INSERT INTO content_category (content_id, category_id)
      SELECT id, category_id FROM content
      WHERE category_id IS NOT NULL
      ON CONFLICT DO NOTHING
    `);
  } catch {
    // content_category may not exist until migration is applied
  }

  const users = await db
    .select({ id: user.id, name: user.name, slug: user.slug, username: user.username })
    .from(user);

  for (const person of users) {
    if (person.slug && person.username) continue;
    const base = slugify(person.username || person.name || person.id) || person.id;
    const unique = `${base}-${person.id.slice(0, 6)}`;
    await db
      .update(user)
      .set({
        slug: person.slug || unique,
        username: person.username || unique,
        updatedAt: now,
      })
      .where(eq(user.id, person.id));
  }
}
