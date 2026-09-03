'use client';

import { useRef, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { AdminButton } from '@/components/admin/fields';
import { cn } from '@/lib/utils';

type AvatarUploadProps = {
  name?: string | null;
  value: string;
  onChange: (url: string) => void;
  className?: string;
};

export function AvatarUpload({
  name,
  value,
  onChange,
  className,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? 'Failed to upload avatar');
        return;
      }

      onChange(data.url);
    } catch {
      setError('Failed to upload avatar');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-4">
        <Avatar name={name} image={value || null} size="lg" />
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleFile}
          />
          <AdminButton
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Uploading...' : value ? 'Replace photo' : 'Upload photo'}
          </AdminButton>
          {value ? (
            <AdminButton
              type="button"
              variant="ghost"
              disabled={uploading}
              onClick={() => onChange('')}
            >
              Remove
            </AdminButton>
          ) : null}
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
