import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIRS = [
  path.join(process.cwd(), 'uploads'),
  path.join(process.cwd(), 'public', 'uploads'),
];

export function isSafeUploadName(filename: string): boolean {
  return /^[\w.-]+$/.test(filename) && !filename.includes('..');
}

export function getPrimaryUploadDir(): string {
  return UPLOAD_DIRS[0];
}

export async function writeUpload(
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const dir = getPrimaryUploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function readUpload(
  filename: string,
): Promise<{ buffer: Buffer; absolutePath: string } | null> {
  if (!isSafeUploadName(filename)) return null;

  for (const dir of UPLOAD_DIRS) {
    try {
      const absolutePath = path.join(dir, filename);
      const buffer = await readFile(absolutePath);
      return { buffer, absolutePath };
    } catch {
      // try next location
    }
  }

  return null;
}

export async function deleteUpload(url: string): Promise<void> {
  const filename = url.replace(/^\/uploads\//, '');
  if (!isSafeUploadName(filename)) return;

  for (const dir of UPLOAD_DIRS) {
    try {
      await unlink(path.join(dir, filename));
    } catch {
      // File may already be gone
    }
  }
}

export function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}
