import type { MetadataRoute } from 'next';
import { listArticleSlugs } from '@/lib/queries/admin';
import { getActiveCategories } from '@/lib/queries/taxonomy';

const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([
    listArticleSlugs(),
    getActiveCategories(),
  ]);

  return [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/authors`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/search`, changeFrequency: 'weekly', priority: 0.4 },
    ...categories.map((item) => ({
      url: `${base}/category/${item.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...articles.map((item) => ({
      url: `${base}/blog/${item.slug}`,
      lastModified: item.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
