'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBlogPost, updateBlogPost } from '@/actions/blog';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { MultiSelect } from '@/components/ui/multi-select';
import type { RichTextDocument } from '@/lib/db/schema';

type CategoryOption = {
  id: string;
  name: string;
};

export type WriteFormInitial = {
  id: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  categoryIds: string[];
  body: RichTextDocument;
  status: string;
};

function emptyDoc(): RichTextDocument {
  return { type: 'doc', content: [] };
}

export function WriteForm({
  categories,
  initial,
}: {
  categories: CategoryOption[];
  initial?: WriteFormInitial;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [categoryIds, setCategoryIds] = useState<string[]>(
    initial?.categoryIds?.length
      ? initial.categoryIds
      : categories[0]
        ? [categories[0].id]
        : [],
  );
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [body, setBody] = useState<RichTextDocument>(
    initial?.body ?? emptyDoc(),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'draft' | 'publish' | null>(null);

  useEffect(() => {
    if (!initial) return;
    setTitle(initial.title);
    setExcerpt(initial.excerpt ?? '');
    setCategoryIds(
      initial.categoryIds.length
        ? initial.categoryIds
        : categories[0]
          ? [categories[0].id]
          : [],
    );
    setCoverImage(initial.coverImage ?? '');
    setBody(initial.body ?? emptyDoc());
    setError(null);
    setLoading(null);
    // Only re-bind when switching posts; key on the parent also remounts the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: bind once per post id
  }, [initial?.id]);

  async function handleCoverUpload(event: ChangeEvent<HTMLInputElement>) {
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

  async function handleSave(publish: boolean) {
    setError(null);

    if (!coverImage) {
      setError('Cover photo is required');
      return;
    }

    if (categoryIds.length === 0) {
      setError('Select at least one category');
      return;
    }

    setLoading(publish ? 'publish' : 'draft');

    const payload = {
      title,
      excerpt,
      coverImage,
      categoryIds,
      body,
      publish,
    };

    const result = initial
      ? await updateBlogPost(initial.id, payload)
      : await createBlogPost(payload);

    if (!result.success) {
      setError(result.error);
      setLoading(null);
      return;
    }

    router.push(result.data.published ? '/' : '/posts');
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="font-display text-xs font-bold tracking-[0.16em] text-ink uppercase"
        >
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Your story title"
          required
          className="w-full border-2 border-ink/30 bg-[color-mix(in_srgb,var(--paper)_90%,white)] px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <p className="font-display text-xs font-bold tracking-[0.16em] text-ink uppercase">
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
          className="font-display text-xs font-bold tracking-[0.16em] text-ink uppercase"
        >
          Summary
        </label>
        <input
          id="excerpt"
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          placeholder="A short summary for the magazine grid"
          className="w-full border-2 border-ink/30 bg-[color-mix(in_srgb,var(--paper)_90%,white)] px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <p className="font-display text-xs font-bold tracking-[0.16em] text-ink uppercase">
          Cover photo <span className="text-muted">Required</span>
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
          <div className="max-w-sm space-y-3">
            <div className="cover-sketch relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt="Cover preview"
                className="aspect-square w-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingCover}
              className="text-xs font-semibold tracking-wider uppercase underline decoration-dashed underline-offset-4"
            >
              {uploadingCover ? 'Uploading...' : 'Replace cover'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingCover}
            className="flex h-40 w-full max-w-sm flex-col items-center justify-center border-2 border-dashed border-ink/40 bg-paper-deep/60 px-4 text-center transition-colors hover:bg-mustard/15 disabled:opacity-60 [border-radius:0.35rem_0.8rem_0.4rem_0.7rem/0.7rem_0.35rem_0.8rem_0.45rem]"
          >
            <span className="font-display text-sm tracking-wide uppercase text-ink">
              {uploadingCover ? 'Uploading...' : 'Add cover photo'}
            </span>
            <span className="mt-2 text-xs text-muted">
              JPEG, PNG, WebP, or GIF · max 5 MB
            </span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <p className="font-display text-xs font-bold tracking-[0.16em] text-ink uppercase">
          Content
        </p>
        <RichTextEditor
          key={initial?.id ?? 'new-post'}
          value={body}
          onChange={setBody}
        />
      </div>

      {error && <p className="text-sm text-coral">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={loading !== null || uploadingCover || !coverImage || categoryIds.length === 0}
          className="sketch-btn px-6 py-3 text-xs font-semibold tracking-wider uppercase disabled:opacity-40"
        >
          {loading === 'draft'
            ? 'Saving…'
            : isEdit
              ? 'Save as draft'
              : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={loading !== null || uploadingCover || !coverImage || categoryIds.length === 0}
          className="sketch-btn-solid px-6 py-3 text-xs font-semibold tracking-wider uppercase disabled:opacity-40"
        >
          {loading === 'publish'
            ? 'Publishing…'
            : isEdit && initial?.status === 'published'
              ? 'Update & publish'
              : 'Publish'}
        </button>
      </div>
    </form>
  );
}
