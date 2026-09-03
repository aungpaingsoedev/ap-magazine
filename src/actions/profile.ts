'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { requireSession } from '@/lib/auth/session';
import { profileFormSchema } from '@/lib/validations/content';
import { slugify } from '@/lib/slug';
import { fail, ok, publicError, type ActionResult } from '@/lib/action-result';

function revalidateProfile(slug: string | null, userId: string) {
  revalidatePath('/profile');
  revalidatePath('/authors');
  revalidatePath(`/authors/${slug ?? userId}`);
}

export async function updateMyProfile(
  input: unknown,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const session = await requireSession();
    const parsed = profileFormSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid profile');
    }

    const data = parsed.data;
    const slug = data.slug || slugify(data.username || data.name) || session.user.id;

    const [slugTaken] = await db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.slug, slug), ne(user.id, session.user.id)))
      .limit(1);
    if (slugTaken) return fail('Profile slug is already in use');

    await db
      .update(user)
      .set({
        name: data.name,
        username: data.username || slug,
        slug,
        bio: data.bio || null,
        website: data.website || null,
        instagram: data.instagram || null,
        twitter: data.twitter || null,
        youtube: data.youtube || null,
        image: data.image || null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    revalidateProfile(slug, session.user.id);
    return ok({ slug });
  } catch (err) {
    return fail(publicError(err, 'Failed to update profile'));
  }
}
