import {
  getStorageBucket,
  getSupabaseAdmin,
  isSupabaseConfigured,
} from '@/lib/supabase/admin';

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

export function isSupabaseStorageUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.pathname.includes('/storage/v1/object/public/');
  } catch {
    return false;
  }
}

function pathFromPublicUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const marker = '/storage/v1/object/public/';
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    const rest = parsed.pathname.slice(index + marker.length);
    // rest = "<bucket>/<path>"
    const slash = rest.indexOf('/');
    if (slash === -1) return null;
    return decodeURIComponent(rest.slice(slash + 1));
  } catch {
    return null;
  }
}

export async function writeUpload(
  filename: string,
  buffer: Buffer,
  contentType = contentTypeFor(filename),
): Promise<string> {
  if (!isSafeUploadName(filename)) {
    throw new Error('Invalid filename');
  }
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();
  const objectPath = `uploads/${filename}`;

  const { error } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
    contentType,
    upsert: false,
    cacheControl: '31536000',
  });

  if (error) {
    throw new Error(error.message || 'Failed to upload to Supabase Storage');
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

export async function deleteUpload(url: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const objectPath = pathFromPublicUrl(url);
  if (!objectPath) return;

  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();
  await supabase.storage.from(bucket).remove([objectPath]);
}
