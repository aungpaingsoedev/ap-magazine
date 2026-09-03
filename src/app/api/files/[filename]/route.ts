import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ filename: string }>;
};

/** Legacy local upload path. New uploads use Supabase public URLs. */
export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params;
  return NextResponse.json(
    {
      error: 'Local uploads are no longer served. Re-upload the image.',
      filename,
    },
    { status: 410 },
  );
}
