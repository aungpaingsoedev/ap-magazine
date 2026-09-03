import { z } from 'zod';
import {
  coverImageSchema,
  richTextDocumentSchema,
} from '@/lib/validations/content';

export const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  excerpt: z.string().max(500).optional(),
  coverImage: coverImageSchema,
  categoryIds: z.array(z.string().min(1)).min(1, 'Select at least one category'),
  body: richTextDocumentSchema,
  publish: z.boolean().default(false),
});

export const commentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(2000),
});

export const reactionTypeSchema = z.enum(['like', 'love', 'insightful']);

export type BlogPostValues = z.infer<typeof blogPostSchema>;
