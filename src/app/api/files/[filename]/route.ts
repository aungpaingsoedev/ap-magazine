import fs from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { contentTypeFor, isSafeUploadName, uploadPath } from '@/lib/cms/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ filename: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params;
  if (!isSafeUploadName(filename)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  try {
    const buffer = await fs.readFile(uploadPath(filename));
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentTypeFor(filename),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
