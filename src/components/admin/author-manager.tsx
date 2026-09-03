'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveAuthor, setAuthorActive } from '@/actions/authors';
import { slugify } from '@/lib/slug';
import {
  AdminButton,
  Field,
  TextArea,
  TextInput,
} from '@/components/admin/fields';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { AvatarUpload } from '@/components/admin/avatar-upload';
import { Avatar } from '@/components/ui/avatar';
import type { User } from '@/lib/db/schema';

export function AuthorManager({ authors }: { authors: User[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState<string | null>(null);

  function start(author?: User) {
    setEditing(author ?? null);
    setName(author?.name ?? '');
    setEmail(author?.email ?? '');
    setUsername(author?.username ?? '');
    setSlug(author?.slug ?? '');
    setBio(author?.bio ?? '');
    setWebsite(author?.website ?? '');
    setInstagram(author?.instagram ?? '');
    setTwitter(author?.twitter ?? '');
    setYoutube(author?.youtube ?? '');
    setImage(author?.image ?? '');
    setError(null);
  }

  async function submit() {
    const result = await saveAuthor({
      id: editing?.id,
      name,
      email,
      username,
      slug: slug || slugify(username || name),
      bio,
      website,
      instagram,
      twitter,
      youtube,
      image: image || null,
      active: editing?.active ?? true,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    start();
    router.refresh();
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <form
        className="space-y-4 border border-neutral-200 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <h2 className="font-display text-lg font-bold">
          {editing ? 'Edit author' : 'New author'}
        </h2>
        <Field label="Avatar photo">
          <AvatarUpload name={name} value={image} onChange={setImage} />
        </Field>
        <Field label="Name">
          <TextInput
            value={name}
            required
            onChange={(event) => {
              setName(event.target.value);
              if (!editing) setSlug(slugify(event.target.value));
            }}
          />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={email} required onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Username">
          <TextInput value={username} onChange={(event) => setUsername(event.target.value)} />
        </Field>
        <Field label="Slug">
          <TextInput value={slug} onChange={(event) => setSlug(event.target.value)} />
        </Field>
        <Field label="Bio">
          <TextArea rows={4} value={bio} onChange={(event) => setBio(event.target.value)} />
        </Field>
        <Field label="Website">
          <TextInput value={website} onChange={(event) => setWebsite(event.target.value)} />
        </Field>
        <Field label="Instagram">
          <TextInput value={instagram} onChange={(event) => setInstagram(event.target.value)} />
        </Field>
        <Field label="X / Twitter">
          <TextInput value={twitter} onChange={(event) => setTwitter(event.target.value)} />
        </Field>
        <Field label="YouTube">
          <TextInput value={youtube} onChange={(event) => setYoutube(event.target.value)} />
        </Field>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AdminButton type="submit">{editing ? 'Update' : 'Create'}</AdminButton>
      </form>

      <div className="overflow-x-auto border border-neutral-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs tracking-wider uppercase">
            <tr>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {authors.map((item) => (
              <tr key={item.id} className="border-b border-neutral-200 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={item.name} image={item.image} size="sm" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-500">{item.email}</td>
                <td className="px-4 py-3">{item.role}</td>
                <td className="px-4 py-3">{item.active ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <AdminButton type="button" variant="ghost" onClick={() => start(item)}>
                      Edit
                    </AdminButton>
                    <Link href={`/authors/${item.slug ?? item.id}`} className="px-3 py-2 text-xs font-semibold tracking-wider uppercase">
                      View
                    </Link>
                    <ConfirmButton
                      label={item.active ? 'Deactivate' : 'Activate'}
                      confirmTitle={item.active ? 'Deactivate author?' : 'Activate author?'}
                      confirmBody="This does not delete their articles."
                      onConfirm={async () => {
                        const result = await setAuthorActive(item.id, !item.active);
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
