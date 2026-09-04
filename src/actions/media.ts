'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { media } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { mediaMetaSchema } from '@/lib/validations/content';
import { fail, ok, publicError, type ActionResult } from '@/lib/action-result';
import { deleteUpload } from '@/lib/cms/storage';

export async function updateMediaAlt(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission('media.manage');
    const parsed = mediaMetaSchema.safeParse(input);
    if (!parsed.success) return fail('Invalid media');

    await db
      .update(media)
      .set({ alt: parsed.data.alt || null })
      .where(eq(media.id, parsed.data.id));

    revalidatePath('/admin/media');
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to update media'));
  }
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  try {
    await requirePermission('media.manage');
    const [item] = await db.select().from(media).where(eq(media.id, id)).limit(1);
    if (!item) return fail('Media not found');

    await db.delete(media).where(eq(media.id, id));

    if (item.url.startsWith('/uploads/')) {
      await deleteUpload(item.url);
    }

    revalidatePath('/admin/media');
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to delete media'));
  }
}
