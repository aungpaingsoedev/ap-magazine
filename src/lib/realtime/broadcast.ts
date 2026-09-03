import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { category, content, user } from '@/lib/db/schema';
import { extractCoverImage, magazineCategory } from '@/lib/blog-utils';
import { emitBlogCreated } from '@/lib/realtime/io';
import type { RealtimeBlogPost } from '@/lib/realtime/events';

export async function broadcastPublishedPost(contentId: string) {
  const [post] = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt,
      coverImage: content.coverImage,
      body: content.body,
      publishedAt: content.publishedAt,
      featured: content.featured,
      editorsPick: content.editorsPick,
      status: content.status,
      authorName: user.name,
      categoryName: category.name,
    })
    .from(content)
    .leftJoin(user, eq(content.createdBy, user.id))
    .leftJoin(category, eq(content.categoryId, category.id))
    .where(eq(content.id, contentId))
    .limit(1);

  if (!post || post.status !== 'published') return;

  const payload: RealtimeBlogPost = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    authorName: post.authorName,
    coverImage: post.coverImage ?? extractCoverImage(post.body),
    category: post.categoryName ?? magazineCategory(post.slug),
    featured: post.featured,
    editorsPick: post.editorsPick,
  };

  emitBlogCreated(payload);
}
