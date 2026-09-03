import type { RichTextDocument } from '@/lib/db/schema';

export function formatMagazineDate(
  date: Date | string | null | undefined,
): string {
  if (!date) return '';
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '';
  const day = value.getDate();
  const month = value.toLocaleString('en-GB', { month: 'long' });
  const year = value.getFullYear();
  return `${day}. ${month} ${year}`;
}

export function estimateReadingMinutes(
  excerpt: string | null | undefined,
  body?: RichTextDocument | null,
): number {
  const fromExcerpt = excerpt ?? '';
  const fromBody = body ? collectText(body) : '';
  const words = `${fromExcerpt} ${fromBody}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function collectText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const record = node as { text?: string; content?: unknown[] };
  const self = typeof record.text === 'string' ? record.text : '';
  const children = Array.isArray(record.content)
    ? record.content.map(collectText).join(' ')
    : '';
  return `${self} ${children}`.trim();
}

export function extractCoverImage(
  body: RichTextDocument | null | undefined,
): string | null {
  if (!body) return null;
  return findImageSrc(body);
}

function findImageSrc(node: unknown): string | null {
  if (!node || typeof node !== 'object') return null;
  const record = node as { type?: string; attrs?: { src?: string }; content?: unknown[] };
  if (record.type === 'image' && typeof record.attrs?.src === 'string') {
    return record.attrs.src;
  }
  if (!Array.isArray(record.content)) return null;
  for (const child of record.content) {
    const found = findImageSrc(child);
    if (found) return found;
  }
  return null;
}

/** Stable visual category label until categories exist in the schema */
export function magazineCategory(slug: string): string {
  const labels = ['Art', 'Culture', 'Design', 'Essay'];
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash + slug.charCodeAt(i) * (i + 1)) % labels.length;
  }
  return labels[hash] ?? 'Essay';
}
