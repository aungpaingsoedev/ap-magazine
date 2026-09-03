export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function uniqueSlugCandidate(base: string, suffix: number): string {
  const trimmed = base || 'item';
  return suffix <= 1 ? trimmed : `${trimmed}-${suffix - 1}`;
}
