import { z } from 'zod';

export const contentStatusSchema = z.enum([
  'draft',
  'review',
  'scheduled',
  'published',
  'archived',
]);

export const richTextDocumentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(z.unknown()).optional(),
});

export const uploadedImageSchema = z
  .string()
  .min(1, 'Image is required')
  .refine(
    (value) =>
      value.startsWith('/uploads/') &&
      /\.(jpe?g|png|webp|gif)$/i.test(value),
    'Upload a JPEG, PNG, WebP, or GIF image',
  );

export const coverImageSchema = uploadedImageSchema;

export const optionalImageSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (value) =>
      !value ||
      (value.startsWith('/uploads/') &&
        /\.(jpe?g|png|webp|gif)$/i.test(value)),
    'Upload a JPEG, PNG, WebP, or GIF image',
  );

export const optionalAvatarSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (value) =>
      !value ||
      (value.startsWith('/uploads/') &&
        /\.(jpe?g|png|webp|gif)$/i.test(value)) ||
      /^https?:\/\//i.test(value),
    'Upload an image or use a valid photo URL',
  );

export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case');

export const articleIntentSchema = z.enum([
  'draft',
  'save',
  'review',
  'publish',
  'schedule',
]);

export const articleFormSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(1, 'Title is required').max(200),
    slug: slugSchema,
    excerpt: z.string().max(500).optional().nullable(),
    coverImage: z.string().optional().nullable(),
    body: richTextDocumentSchema,
    categoryId: z.string().min(1).optional().nullable(),
    categoryIds: z.array(z.string().min(1)).optional().default([]),
    tagIds: z.array(z.string()).optional().default([]),
    authorId: z.string().optional().nullable(),
    featured: z.boolean().optional().default(false),
    editorsPick: z.boolean().optional().default(false),
    displayOrder: z.coerce.number().int().optional().default(0),
    publishedAt: z.string().optional().nullable(),
    seoTitle: z.string().max(70).optional().nullable(),
    seoDescription: z.string().max(160).optional().nullable(),
    seoImage: optionalImageSchema,
    canonicalUrl: z
      .string()
      .url('Canonical URL must be valid')
      .optional()
      .nullable()
      .or(z.literal('')),
    noIndex: z.boolean().optional().default(false),
    noFollow: z.boolean().optional().default(false),
    intent: articleIntentSchema,
  })
  .superRefine((data, ctx) => {
    const needsCover = data.intent === 'publish' || data.intent === 'schedule';
    if (needsCover && !data.coverImage) {
      ctx.addIssue({
        code: 'custom',
        path: ['coverImage'],
        message: 'Cover photo is required to publish or schedule',
      });
    }
    const categoryIds =
      data.categoryIds?.length
        ? data.categoryIds
        : data.categoryId
          ? [data.categoryId]
          : [];
    if (categoryIds.length === 0 && (data.intent === 'publish' || data.intent === 'schedule')) {
      ctx.addIssue({
        code: 'custom',
        path: ['categoryIds'],
        message: 'Select at least one category',
      });
    }
    if (data.coverImage) {
      const parsed = uploadedImageSchema.safeParse(data.coverImage);
      if (!parsed.success) {
        ctx.addIssue({
          code: 'custom',
          path: ['coverImage'],
          message: 'Upload a JPEG, PNG, WebP, or GIF cover photo',
        });
      }
    }
    if (data.intent === 'schedule') {
      if (!data.publishedAt) {
        ctx.addIssue({
          code: 'custom',
          path: ['publishedAt'],
          message: 'Schedule date is required',
        });
      } else {
        const when = new Date(data.publishedAt);
        if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
          ctx.addIssue({
            code: 'custom',
            path: ['publishedAt'],
            message: 'Schedule date must be in the future',
          });
        }
      }
    }
  });

export const contentFormSchema = articleFormSchema;

export type ArticleFormValues = z.infer<typeof articleFormSchema>;
export type ContentFormValues = ArticleFormValues;

export const categoryFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(80),
  slug: slugSchema,
  description: z.string().max(500).optional().nullable(),
  image: optionalImageSchema,
  sortOrder: z.coerce.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});

export const tagFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(80),
  slug: slugSchema,
});

export const authorFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email('Valid email is required'),
  username: z.string().max(80).optional().nullable(),
  slug: slugSchema.optional().nullable().or(z.literal('')),
  bio: z.string().max(2000).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  instagram: z.string().max(200).optional().nullable(),
  twitter: z.string().max(200).optional().nullable(),
  youtube: z.string().max(200).optional().nullable(),
  image: optionalAvatarSchema,
  active: z.boolean().optional().default(true),
  role: z.enum(['admin', 'editor', 'author', 'media_manager', 'viewer']).optional(),
});

export const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  username: z.string().max(80).optional().nullable(),
  slug: slugSchema.optional().nullable().or(z.literal('')),
  bio: z.string().max(2000).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  instagram: z.string().max(200).optional().nullable(),
  twitter: z.string().max(200).optional().nullable(),
  youtube: z.string().max(200).optional().nullable(),
  image: optionalAvatarSchema,
});

export const settingsFormSchema = z.object({
  siteName: z.string().min(1).max(120),
  logo: optionalImageSchema,
  favicon: optionalImageSchema,
  description: z.string().max(300).optional().nullable(),
  instagram: z.string().max(200).optional().nullable(),
  twitter: z.string().max(200).optional().nullable(),
  youtube: z.string().max(200).optional().nullable(),
  footerText: z.string().max(300).optional().nullable(),
  homepageHeadline: z.string().max(80).optional().nullable(),
  articlesPerPage: z.coerce.number().int().min(1).max(48),
  defaultSeoTitle: z.string().max(70).optional().nullable(),
  defaultSeoDescription: z.string().max(160).optional().nullable(),
  defaultSeoImage: optionalImageSchema,
});

export const mediaMetaSchema = z.object({
  id: z.string(),
  alt: z.string().max(200).optional().nullable(),
});

export const userRoleFormSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'editor', 'author', 'media_manager', 'viewer']),
});
