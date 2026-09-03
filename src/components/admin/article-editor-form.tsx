'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/slug';
import { saveArticle, restoreRevision } from '@/actions/articles';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { MediaPicker } from '@/components/admin/media-picker';
import {
  AdminButton,
  Field,
  Select,
  TextArea,
  TextInput,
} from '@/components/admin/fields';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { MultiSelect } from '@/components/ui/multi-select';
import type { RichTextDocument } from '@/lib/db/schema';

type Option = { id: string; name: string };

type Revision = {
  id: string;
  version: number;
  title: string;
  createdAt: Date | string;
  editorName: string | null;
};

type ArticleEditorFormProps = {
  article?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    body: RichTextDocument;
    categoryId: string | null;
    categoryIds: string[];
    tagIds: string[];
    createdBy: string | null;
    featured: boolean;
    editorsPick: boolean;
    displayOrder: number;
    publishedAt: Date | string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoImage: string | null;
    canonicalUrl: string | null;
    noIndex: boolean;
    noFollow: boolean;
  };
  categories: Option[];
  tags: Option[];
  authors: Option[];
  revisions?: Revision[];
  canPublish: boolean;
  canAssignAuthor: boolean;
};

function toLocalInput(value: Date | string | null | undefined) {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ArticleEditorForm({
  article,
  categories,
  tags,
  authors,
  revisions = [],
  canPublish,
  canAssignAuthor,
}: ArticleEditorFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title ?? '');
  const [slug, setSlug] = useState(article?.slug ?? '');
  const [slugLocked, setSlugLocked] = useState(Boolean(article?.slug));
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? '');
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? '');
  const [body, setBody] = useState<RichTextDocument>(
    article?.body ?? { type: 'doc', content: [] },
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(
    article?.categoryIds?.length
      ? article.categoryIds
      : article?.categoryId
        ? [article.categoryId]
        : [],
  );
  const [tagIds, setTagIds] = useState<string[]>(article?.tagIds ?? []);
  const [authorId, setAuthorId] = useState(article?.createdBy ?? '');
  const [featured, setFeatured] = useState(article?.featured ?? false);
  const [editorsPick, setEditorsPick] = useState(article?.editorsPick ?? false);
  const [displayOrder, setDisplayOrder] = useState(article?.displayOrder ?? 0);
  const [publishedAt, setPublishedAt] = useState(toLocalInput(article?.publishedAt));
  const [seoTitle, setSeoTitle] = useState(article?.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(article?.seoDescription ?? '');
  const [seoImage, setSeoImage] = useState(article?.seoImage ?? '');
  const [canonicalUrl, setCanonicalUrl] = useState(article?.canonicalUrl ?? '');
  const [noIndex, setNoIndex] = useState(article?.noIndex ?? false);
  const [noFollow, setNoFollow] = useState(article?.noFollow ?? false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState<'cover' | 'seo' | null>(null);

  const payload = useMemo(
    () => ({
      id: article?.id,
      title,
      slug,
      excerpt,
      coverImage: coverImage || null,
      body,
      categoryIds,
      tagIds,
      authorId: authorId || null,
      featured,
      editorsPick,
      displayOrder,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
      seoTitle,
      seoDescription,
      seoImage: seoImage || null,
      canonicalUrl,
      noIndex,
      noFollow,
    }),
    [
      article?.id,
      title,
      slug,
      excerpt,
      coverImage,
      body,
      categoryIds,
      tagIds,
      authorId,
      featured,
      editorsPick,
      displayOrder,
      publishedAt,
      seoTitle,
      seoDescription,
      seoImage,
      canonicalUrl,
      noIndex,
      noFollow,
    ],
  );

  async function submit(intent: 'draft' | 'save' | 'review' | 'publish' | 'schedule') {
    setError(null);
    setLoading(true);
    const result = await saveArticle({ ...payload, intent });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/admin/articles/${result.data.id}`);
    router.refresh();
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        <Field label="Title">
          <TextInput
            value={title}
            onChange={(event) => {
              const next = event.target.value;
              setTitle(next);
              if (!slugLocked) setSlug(slugify(next));
            }}
            required
          />
        </Field>
        <Field label="Slug" hint="Generated from the title; you can edit it.">
          <TextInput
            value={slug}
            onChange={(event) => {
              setSlugLocked(true);
              setSlug(event.target.value);
            }}
            required
          />
        </Field>
        <Field label="Excerpt">
          <TextArea
            rows={3}
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
          />
        </Field>
        <Field label="Cover image">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImage} alt="" className="mb-3 aspect-[16/10] w-full object-cover grayscale" />
          ) : null}
          <AdminButton type="button" variant="outline" onClick={() => setPicker('cover')}>
            {coverImage ? 'Replace cover' : 'Select cover'}
          </AdminButton>
        </Field>
        <Field label="Content">
          <RichTextEditor value={body} onChange={setBody} enableMediaLibrary />
        </Field>
      </div>

      <aside className="space-y-6 border border-neutral-200 p-5">
        <Field label="Categories">
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
          />
        </Field>
        <fieldset className="space-y-2">
          <legend className="font-display text-xs font-bold tracking-[0.16em] uppercase">
            Tags
          </legend>
          <div className="flex flex-col gap-2">
            {tags.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={tagIds.includes(item.id)}
                  onChange={(event) => {
                    setTagIds((current) =>
                      event.target.checked
                        ? [...current, item.id]
                        : current.filter((id) => id !== item.id),
                    );
                  }}
                />
                {item.name}
              </label>
            ))}
            {tags.length === 0 ? (
              <p className="text-xs text-neutral-500">Create tags in the Tags section.</p>
            ) : null}
          </div>
        </fieldset>
        {canAssignAuthor ? (
          <Field label="Author">
            <Select value={authorId} onChange={(event) => setAuthorId(event.target.value)}>
              <option value="">Current user</option>
              {authors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        {canPublish ? (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={(event) => setFeatured(event.target.checked)}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editorsPick}
                onChange={(event) => setEditorsPick(event.target.checked)}
              />
              Editor&apos;s pick
            </label>
            <Field label="Display order">
              <TextInput
                type="number"
                value={displayOrder}
                onChange={(event) => setDisplayOrder(Number(event.target.value))}
              />
            </Field>
            <Field label="Publish / schedule date">
              <TextInput
                type="datetime-local"
                value={publishedAt}
                onChange={(event) => setPublishedAt(event.target.value)}
              />
            </Field>
          </>
        ) : null}

        <div className="space-y-3 border-t border-neutral-200 pt-4">
          <p className="font-display text-xs font-bold tracking-[0.16em] uppercase">SEO</p>
          <Field label="SEO title">
            <TextInput value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
          </Field>
          <Field label="SEO description">
            <TextArea
              rows={3}
              value={seoDescription}
              onChange={(event) => setSeoDescription(event.target.value)}
            />
          </Field>
          <Field label="SEO image">
            {seoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seoImage} alt="" className="mb-2 h-20 w-full object-cover grayscale" />
            ) : null}
            <AdminButton type="button" variant="outline" onClick={() => setPicker('seo')}>
              Select
            </AdminButton>
          </Field>
          <Field label="Canonical URL">
            <TextInput
              value={canonicalUrl}
              onChange={(event) => setCanonicalUrl(event.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={noIndex} onChange={(event) => setNoIndex(event.target.checked)} />
            noindex
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={noFollow} onChange={(event) => setNoFollow(event.target.checked)} />
            nofollow
          </label>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-col gap-2">
          <AdminButton type="button" variant="outline" disabled={loading} onClick={() => submit('draft')}>
            Save draft
          </AdminButton>
          <AdminButton type="button" variant="outline" disabled={loading} onClick={() => submit('save')}>
            Save
          </AdminButton>
          <AdminButton type="button" variant="outline" disabled={loading} onClick={() => submit('review')}>
            Submit for review
          </AdminButton>
          {canPublish ? (
            <>
              <AdminButton type="button" disabled={loading} onClick={() => submit('publish')}>
                Publish
              </AdminButton>
              <AdminButton type="button" variant="outline" disabled={loading} onClick={() => submit('schedule')}>
                Schedule
              </AdminButton>
            </>
          ) : null}
        </div>

        {revisions.length > 0 ? (
          <div className="border-t border-neutral-200 pt-4">
            <p className="font-display text-xs font-bold tracking-[0.16em] uppercase">
              Revisions
            </p>
            <ul className="mt-3 space-y-2">
              {revisions.map((revision) => (
                <li key={revision.id} className="flex items-center justify-between gap-2 text-xs">
                  <span>
                    v{revision.version} · {revision.editorName ?? 'Unknown'}
                  </span>
                  {article ? (
                    <ConfirmButton
                      label="Restore"
                      confirmTitle="Restore this revision?"
                      confirmBody="The current article content will be saved as a new revision first."
                      onConfirm={() => restoreRevision(article.id, revision.id)}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>

      <MediaPicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        onSelect={(url) => {
          if (picker === 'seo') setSeoImage(url);
          else setCoverImage(url);
        }}
      />
    </div>
  );
}
