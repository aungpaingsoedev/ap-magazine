import { contentTypeFor, readUpload } from '@/lib/cms/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ filename: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params;
  const file = await readUpload(filename);

  if (!file) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      'Content-Type': contentTypeFor(filename),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
