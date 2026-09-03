import { headers } from 'next/headers';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { media } from '@/lib/db/schema';
import { getImageDimensions } from '@/lib/cms/image-meta';
import { writeUpload } from '@/lib/cms/storage';
import { can } from '@/lib/auth/session';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

async function saveFile(
  file: File,
  userId: string,
): Promise<{ url: string; id: string; filename: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Image must be under 5 MB');
  }

  const extension = EXTENSIONS[file.type] ?? 'jpg';
  const filename = `${nanoid()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await writeUpload(filename, buffer);
  const dimensions = getImageDimensions(buffer, file.type);
  const id = nanoid();

  await db.insert(media).values({
    id,
    url,
    filename: file.name || filename,
    mimeType: file.type,
    size: file.size,
    width: dimensions.width,
    height: dimensions.height,
    uploadedBy: userId,
    createdAt: new Date(),
  });

  return { url, id, filename };
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!can(session.user, 'media.manage') && !can(session.user, 'articles.create') && !can(session.user, 'authors.manage')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll('file')
    .concat(formData.getAll('files'))
    .filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    const items = [];
    for (const file of files) {
      items.push(await saveFile(file, session.user.id));
    }

    return Response.json({
      url: items[0]?.url,
      id: items[0]?.id,
      items,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to upload image';
    const status =
      message.includes('allowed') || message.includes('5 MB') ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
