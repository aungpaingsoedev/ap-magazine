'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, ne } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { category, tag } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { categoryFormSchema, tagFormSchema } from '@/lib/validations/content';
import { fail, ok, publicError, type ActionResult } from '@/lib/action-result';

function revalidateTaxonomy() {
  revalidatePath('/');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/tags');
  revalidatePath('/admin/articles');
}

export async function saveCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('taxonomy.manage');
    const parsed = categoryFormSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid category');
    }

    const data = parsed.data;
    const [taken] = await db
      .select({ id: category.id })
      .from(category)
      .where(
        data.id
          ? and(eq(category.slug, data.slug), ne(category.id, data.id))
          : eq(category.slug, data.slug),
      )
      .limit(1);

    if (taken) return fail('Slug is already in use');

    const now = new Date();
    const id = data.id ?? nanoid();

    if (data.id) {
      await db
        .update(category)
        .set({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          image: data.image || null,
          sortOrder: data.sortOrder ?? 0,
          active: data.active ?? true,
          updatedAt: now,
        })
        .where(eq(category.id, data.id));
    } else {
      await db.insert(category).values({
        id,
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image: data.image || null,
        sortOrder: data.sortOrder ?? 0,
        active: data.active ?? true,
        createdAt: now,
        updatedAt: now,
      });
    }

    revalidateTaxonomy();
    return ok({ id });
  } catch (err) {
    return fail(publicError(err, 'Failed to save category'));
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await requirePermission('taxonomy.manage');
    await db.delete(category).where(eq(category.id, id));
    revalidateTaxonomy();
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to delete category'));
  }
}

export async function saveTag(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('taxonomy.manage');
    const parsed = tagFormSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid tag');
    }

    const data = parsed.data;
    const [taken] = await db
      .select({ id: tag.id })
      .from(tag)
      .where(
        data.id
          ? and(eq(tag.slug, data.slug), ne(tag.id, data.id))
          : eq(tag.slug, data.slug),
      )
      .limit(1);

    if (taken) return fail('Slug is already in use');

    const now = new Date();
    const id = data.id ?? nanoid();

    if (data.id) {
      await db
        .update(tag)
        .set({
          name: data.name,
          slug: data.slug,
          updatedAt: now,
        })
        .where(eq(tag.id, data.id));
    } else {
      await db.insert(tag).values({
        id,
        name: data.name,
        slug: data.slug,
        createdAt: now,
        updatedAt: now,
      });
    }

    revalidateTaxonomy();
    return ok({ id });
  } catch (err) {
    return fail(publicError(err, 'Failed to save tag'));
  }
}

export async function deleteTag(id: string): Promise<ActionResult> {
  try {
    await requirePermission('taxonomy.manage');
    await db.delete(tag).where(eq(tag.id, id));
    revalidateTaxonomy();
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to delete tag'));
  }
}
