'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteMedia, updateMediaAlt } from '@/actions/media';
import { AdminButton, TextInput } from '@/components/admin/fields';
import { ConfirmButton } from '@/components/admin/confirm-button';
import type { Media } from '@/lib/db/schema';

export function MediaLibrary({ items }: { items: Media[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alts, setAlts] = useState<Record<string, string>>(
    Object.fromEntries(items.map((item) => [item.id, item.alt ?? ''])),
  );

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    for (const file of files) {
      formData.append('file', file);
    }

    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? 'Upload failed');
    } else {
      router.refresh();
    }
    setUploading(false);
    event.target.value = '';
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(
      `${window.location.origin}${url}`,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <AdminButton type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload images'}
        </AdminButton>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={upload}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="border border-neutral-200 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt ?? ''} className="aspect-square w-full object-cover grayscale" />
            <p className="mt-3 truncate text-sm font-medium">{item.filename}</p>
            <p className="text-xs text-neutral-500">
              {(item.size / 1024).toFixed(1)} KB
              {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
            </p>
            <div className="mt-3 space-y-2">
              <TextInput
                value={alts[item.id] ?? ''}
                placeholder="Alt text"
                onChange={(event) =>
                  setAlts((current) => ({ ...current, [item.id]: event.target.value }))
                }
                onBlur={() => updateMediaAlt({ id: item.id, alt: alts[item.id] })}
              />
              <div className="flex flex-wrap gap-2">
                <AdminButton type="button" variant="outline" onClick={() => copyUrl(item.url)}>
                  Copy URL
                </AdminButton>
                <ConfirmButton
                  label="Delete"
                  confirmTitle="Delete this file?"
                  confirmBody="The file will be removed from the library."
                  onConfirm={async () => {
                    const result = await deleteMedia(item.id);
                    if (result.success) router.refresh();
                    return result;
                  }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
