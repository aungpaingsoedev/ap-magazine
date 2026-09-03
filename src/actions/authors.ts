'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, ne } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { authorFormSchema, userRoleFormSchema } from '@/lib/validations/content';
import { slugify } from '@/lib/slug';
import { fail, ok, publicError, type ActionResult } from '@/lib/action-result';

function revalidateAuthors() {
  revalidatePath('/admin/authors');
  revalidatePath('/admin/users');
  revalidatePath('/authors');
}

export async function saveAuthor(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('authors.manage');
    const parsed = authorFormSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid author');
    }

    const data = parsed.data;
    const slug = data.slug || slugify(data.username || data.name);
    const now = new Date();

    if (slug) {
      const [slugTaken] = await db
        .select({ id: user.id })
        .from(user)
        .where(
          data.id
            ? and(eq(user.slug, slug), ne(user.id, data.id))
            : eq(user.slug, slug),
        )
        .limit(1);
      if (slugTaken) return fail('Author slug is already in use');
    }

    const [emailTaken] = await db
      .select({ id: user.id })
      .from(user)
      .where(
        data.id
          ? and(eq(user.email, data.email), ne(user.id, data.id))
          : eq(user.email, data.email),
      )
      .limit(1);
    if (emailTaken) return fail('Email is already in use');

    const id = data.id ?? nanoid();

    if (data.id) {
      await db
        .update(user)
        .set({
          name: data.name,
          email: data.email,
          username: data.username || slug,
          slug,
          bio: data.bio || null,
          website: data.website || null,
          instagram: data.instagram || null,
          twitter: data.twitter || null,
          youtube: data.youtube || null,
          image: data.image || null,
          active: data.active ?? true,
          updatedAt: now,
        })
        .where(eq(user.id, data.id));
    } else {
      await db.insert(user).values({
        id,
        name: data.name,
        email: data.email,
        emailVerified: false,
        username: data.username || slug,
        slug,
        bio: data.bio || null,
        website: data.website || null,
        instagram: data.instagram || null,
        twitter: data.twitter || null,
        youtube: data.youtube || null,
        image: data.image || null,
        role: 'author',
        active: data.active ?? true,
        createdAt: now,
        updatedAt: now,
      });
    }

    revalidateAuthors();
    return ok({ id });
  } catch (err) {
    return fail(publicError(err, 'Failed to save author'));
  }
}

export async function setAuthorActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    await requirePermission('authors.manage');
    await db
      .update(user)
      .set({ active, updatedAt: new Date() })
      .where(eq(user.id, id));
    revalidateAuthors();
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to update author'));
  }
}

export async function updateUserRole(input: unknown): Promise<ActionResult> {
  try {
    const session = await requirePermission('users.manage');
    const parsed = userRoleFormSchema.safeParse(input);
    if (!parsed.success) return fail('Invalid role');

    if (parsed.data.userId === session.user.id && parsed.data.role !== 'admin') {
      return fail('You cannot remove your own admin role');
    }

    await db
      .update(user)
      .set({ role: parsed.data.role, updatedAt: new Date() })
      .where(eq(user.id, parsed.data.userId));

    revalidateAuthors();
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to update user role'));
  }
}
