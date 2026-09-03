export const BLOG_CREATED_EVENT = 'blog:created' as const;

export type RealtimeBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  authorName: string | null;
  coverImage: string | null;
  category: string;
  featured: boolean;
  editorsPick: boolean;
};
