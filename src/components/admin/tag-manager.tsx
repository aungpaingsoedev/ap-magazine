'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTag, saveTag } from '@/actions/taxonomy';
import { slugify } from '@/lib/slug';
import { AdminButton, Field, TextInput } from '@/components/admin/fields';
import { ConfirmButton } from '@/components/admin/confirm-button';
import type { Tag } from '@/lib/db/schema';

export function TagManager({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Tag | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  function start(tag?: Tag) {
    setEditing(tag ?? null);
    setName(tag?.name ?? '');
    setSlug(tag?.slug ?? '');
    setError(null);
  }

  async function submit() {
    const result = await saveTag({
      id: editing?.id,
      name,
      slug: slug || slugify(name),
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    start();
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <form
        className="space-y-4 border border-neutral-200 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <h2 className="font-display text-lg font-bold">{editing ? 'Edit tag' : 'New tag'}</h2>
        <Field label="Name">
          <TextInput
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!editing) setSlug(slugify(event.target.value));
            }}
            required
          />
        </Field>
        <Field label="Slug">
          <TextInput value={slug} onChange={(event) => setSlug(event.target.value)} required />
        </Field>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AdminButton type="submit">{editing ? 'Update' : 'Create'}</AdminButton>
      </form>

      <div className="overflow-x-auto border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs tracking-wider uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((item) => (
              <tr key={item.id} className="border-b border-neutral-200 last:border-0">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-neutral-500">{item.slug}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <AdminButton type="button" variant="ghost" onClick={() => start(item)}>
                      Edit
                    </AdminButton>
                    <ConfirmButton
                      label="Delete"
                      confirmTitle="Delete tag?"
                      confirmBody="The tag will be removed from all articles."
                      onConfirm={async () => {
                        const result = await deleteTag(item.id);
                        if (result.success) router.refresh();
                        return result;
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
