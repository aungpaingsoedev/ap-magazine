import fs from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export function isSafeUploadName(filename: string): boolean {
  return /^[\w.-]+$/.test(filename) && !filename.includes('..');
}

function contentTypeFor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

export { contentTypeFor };

export function uploadPath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}

export async function writeUpload(
  filename: string,
  buffer: Buffer,
  _contentType = contentTypeFor(filename),
): Promise<string> {
  if (!isSafeUploadName(filename)) {
    throw new Error('Invalid filename');
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(uploadPath(filename), buffer);
  return `/uploads/${filename}`;
}

export async function deleteUpload(url: string): Promise<void> {
  if (!url.startsWith('/uploads/')) return;
  const filename = url.slice('/uploads/'.length);
  if (!isSafeUploadName(filename)) return;

  try {
    await fs.unlink(uploadPath(filename));
  } catch {
    // already gone
  }
}
