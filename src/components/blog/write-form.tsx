'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBlogPost } from '@/actions/blog';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { MultiSelect } from '@/components/ui/multi-select';
import type { RichTextDocument } from '@/lib/db/schema';

type CategoryOption = {
  id: string;
  name: string;
};

export function WriteForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>(
    categories[0] ? [categories[0].id] : [],
  );
  const [coverImage, setCoverImage] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [body, setBody] = useState<RichTextDocument>({
    type: 'doc',
    content: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? 'Failed to upload cover photo');
        return;
      }

      setCoverImage(data.url);
    } catch {
      setError('Failed to upload cover photo');
    } finally {
      setUploadingCover(false);
      event.target.value = '';
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!coverImage) {
      setError('Cover photo is required');
      return;
    }

    if (categoryIds.length === 0) {
      setError('Select at least one category');
      return;
    }

    setLoading(true);

    const result = await createBlogPost({
      title,
      excerpt,
      coverImage,
      categoryIds,
      body,
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(/blog/ + result.data.slug);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="font-display text-xs font-bold tracking-[0.16em] text-neutral-950 uppercase"
        >
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Your story title"
          required
          className="w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <p className="font-display text-xs font-bold tracking-[0.16em] text-neutral-950 uppercase">
          Categories
        </p>
        <MultiSelect
          options={categories.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          selected={categoryIds}
          onChange={setCategoryIds}
          placeholder="Select categories..."
          searchPlaceholder="Search categories..."
          emptyText="No categories found."
          disabled={categories.length === 0}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="excerpt"
          className="font-display text-xs font-bold tracking-[0.16em] text-neutral-950 uppercase"
        >
          Summary
        </label>
        <input
          id="excerpt"
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          placeholder="A short summary for the magazine grid"
          className="w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <p className="font-display text-xs font-bold tracking-[0.16em] text-neutral-950 uppercase">
          Cover photo <span className="text-neutral-500">Required</span>
        </p>
        <input
          ref={fileInputRef}
          id="cover"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleCoverUpload}
        />
        {coverImage ? (
          <div className="space-y-3">
            <div className="relative overflow-hidden border border-neutral-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt="Cover preview"
                className="aspect-[4/3] w-full object-cover grayscale"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingCover}
              className="text-xs font-semibold tracking-wider uppercase underline underline-offset-4"
            >
              {uploadingCover ? 'Uploading...' : 'Replace cover'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingCover}
            className="flex aspect-[4/3] w-full flex-col items-center justify-center border border-dashed border-neutral-400 bg-neutral-50 px-6 text-center transition-colors hover:bg-neutral-100 disabled:opacity-60"
          >
            <span className="font-display text-sm font-bold tracking-wide uppercase">
              {uploadingCover ? 'Uploading...' : 'Add cover photo'}
            </span>
            <span className="mt-2 text-xs text-neutral-500">
              JPEG, PNG, WebP, or GIF · max 5 MB
            </span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <p className="font-display text-xs font-bold tracking-[0.16em] text-neutral-950 uppercase">
          Content
        </p>
        <RichTextEditor value={body} onChange={setBody} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || uploadingCover || !coverImage || categoryIds.length === 0}
        className="border border-neutral-950 bg-neutral-950 px-6 py-3 text-xs font-semibold tracking-wider text-white uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        {loading ? 'Publishing...' : 'Publish'}
      </button>
    </form>
  );
}
