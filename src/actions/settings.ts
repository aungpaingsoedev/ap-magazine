'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { settingsFormSchema } from '@/lib/validations/content';
import { ensureCmsDefaults } from '@/lib/db/seed';
import { fail, ok, publicError, type ActionResult } from '@/lib/action-result';

export async function saveSettings(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission('settings.manage');
    await ensureCmsDefaults();
    const parsed = settingsFormSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid settings');
    }

    await db
      .update(siteSettings)
      .set({
        ...parsed.data,
        logo: parsed.data.logo || null,
        favicon: parsed.data.favicon || null,
        description: parsed.data.description || null,
        instagram: parsed.data.instagram || null,
        twitter: parsed.data.twitter || null,
        youtube: parsed.data.youtube || null,
        footerText: parsed.data.footerText || null,
        homepageHeadline: parsed.data.homepageHeadline || 'Magazine',
        defaultSeoTitle: parsed.data.defaultSeoTitle || null,
        defaultSeoDescription: parsed.data.defaultSeoDescription || null,
        defaultSeoImage: parsed.data.defaultSeoImage || null,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, 'default'));

    revalidatePath('/');
    revalidatePath('/admin/settings');
    revalidatePath('/admin/seo');
    return ok(undefined);
  } catch (err) {
    return fail(publicError(err, 'Failed to save settings'));
  }
}
