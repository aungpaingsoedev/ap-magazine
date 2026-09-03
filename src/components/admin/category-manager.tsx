'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCategory, deleteCategory } from '@/actions/taxonomy';
import { slugify } from '@/lib/slug';
import {
  AdminButton,
  Field,
  TextArea,
  TextInput,
} from '@/components/admin/fields';
import { ConfirmButton } from '@/components/admin/confirm-button';
import type { Category } from '@/lib/db/schema';

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function start(category?: Category) {
    setEditing(category ?? null);
    setName(category?.name ?? '');
    setSlug(category?.slug ?? '');
    setDescription(category?.description ?? '');
    setSortOrder(category?.sortOrder ?? 0);
    setActive(category?.active ?? true);
    setError(null);
  }

  async function submit() {
    const result = await saveCategory({
      id: editing?.id,
      name,
      slug: slug || slugify(name),
      description,
      sortOrder,
      active,
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
        <h2 className="font-display text-lg font-bold">
          {editing ? 'Edit category' : 'New category'}
        </h2>
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
        <Field label="Description">
          <TextArea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <Field label="Sort order">
          <TextInput
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(Number(event.target.value))}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
          Active
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <AdminButton type="submit">{editing ? 'Update' : 'Create'}</AdminButton>
          {editing ? (
            <AdminButton type="button" variant="ghost" onClick={() => start()}>
              Cancel
            </AdminButton>
          ) : null}
        </div>
      </form>

      <div className="overflow-x-auto border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs tracking-wider uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((item) => (
              <tr key={item.id} className="border-b border-neutral-200 last:border-0">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-neutral-500">{item.slug}</td>
                <td className="px-4 py-3">{item.sortOrder}</td>
                <td className="px-4 py-3">{item.active ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <AdminButton type="button" variant="ghost" onClick={() => start(item)}>
                      Edit
                    </AdminButton>
                    <ConfirmButton
                      label="Delete"
                      confirmTitle="Delete category?"
                      confirmBody="Articles in this category will keep their content but lose the category assignment."
                      onConfirm={async () => {
                        const result = await deleteCategory(item.id);
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
