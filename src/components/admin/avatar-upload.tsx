'use client';

import { useRef, useState } from 'react';
import { Camera, Check, Upload } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DEFAULT_AVATARS } from '@/lib/avatars';
import { cn } from '@/lib/utils';

type AvatarUploadProps = {
  name?: string | null;
  subtitle?: string | null;
  value: string;
  onChange: (url: string) => void;
  className?: string;
};

export function AvatarUpload({
  name,
  subtitle,
  value,
  onChange,
  className,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
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
      setOpen(false);
    } catch {
      setError('Failed to upload avatar');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  function selectAvatar(url: string) {
    setError(null);
    onChange(url);
    setOpen(false);
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <Avatar name={name} image={value || null} size="xl" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute -right-0.5 -bottom-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-neutral-950 text-white shadow-sm transition-opacity hover:opacity-80"
            aria-label="Change profile photo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {name ? (
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-neutral-950">
                {name}
              </p>
              {subtitle ? (
                <p className="truncate text-sm text-neutral-500">{subtitle}</p>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-950 transition-colors hover:border-neutral-950 hover:bg-neutral-50"
          >
            Change photo
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a profile photo</DialogTitle>
            <DialogDescription>
              Select an avatar, then save your profile changes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleFile}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-950 transition-colors hover:border-neutral-950 hover:bg-neutral-50 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload from computer'}
            </button>
            <p className="text-center text-xs text-neutral-500">
              PNG, JPG, WEBP, or GIF
            </p>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {DEFAULT_AVATARS.map((avatar) => {
              const selected = value === avatar;
              return (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => selectAvatar(avatar)}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-full ring-2 ring-offset-2 transition-opacity hover:opacity-80',
                    selected
                      ? 'ring-neutral-950'
                      : 'ring-transparent',
                  )}
                  aria-label="Select avatar"
                  aria-pressed={selected}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {selected ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </DialogContent>
      </Dialog>

      {error && !open ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
