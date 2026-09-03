import { getPublishedPosts } from '@/lib/queries/blog';
import { getSiteSettings } from '@/lib/queries/taxonomy';

const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export async function GET() {
  const [posts, settings] = await Promise.all([
    getPublishedPosts(),
    getSiteSettings(),
  ]);

  const items = posts
    .slice(0, 30)
    .map((post) => {
      const url = `${base}/blog/${post.slug}`;
      return `<item>
        <title>${escapeXml(post.title)}</title>
        <link>${url}</link>
        <guid>${url}</guid>
        <pubDate>${(post.publishedAt ?? new Date()).toUTCString()}</pubDate>
        <description>${escapeXml(post.excerpt ?? '')}</description>
      </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(settings?.siteName ?? 'Atlas Magazine')}</title>
    <link>${base}</link>
    <description>${escapeXml(settings?.description ?? 'Atlas Magazine')}</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=600, stale-while-revalidate',
    },
  });
}
