'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateMyProfile } from '@/actions/profile';
import { slugify } from '@/lib/slug';
import {
  AdminButton,
  Field,
  TextArea,
  TextInput,
} from '@/components/admin/fields';
import { AvatarUpload } from '@/components/admin/avatar-upload';
import type { User } from '@/lib/db/schema';

export function ProfileForm({ profile }: { profile: User }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username ?? '');
  const [slug, setSlug] = useState(profile.slug ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [website, setWebsite] = useState(profile.website ?? '');
  const [instagram, setInstagram] = useState(profile.instagram ?? '');
  const [twitter, setTwitter] = useState(profile.twitter ?? '');
  const [youtube, setYoutube] = useState(profile.youtube ?? '');
  const [image, setImage] = useState(profile.image ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const publicPath = `/authors/${slug || profile.slug || profile.id}`;

  async function submit() {
    setPending(true);
    setError(null);
    setSaved(false);
    const result = await updateMyProfile({
      name,
      username,
      slug: slug || slugify(username || name),
      bio,
      website,
      instagram,
      twitter,
      youtube,
      image: image || null,
    });
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSaved(true);
    setSlug(result.data.slug);
    router.refresh();
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Field label="Avatar photo">
        <AvatarUpload name={name} value={image} onChange={setImage} />
      </Field>
      <Field label="Name">
        <TextInput
          value={name}
          required
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label="Email" hint="Managed by your sign-in account">
        <TextInput type="email" value={profile.email} disabled />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Username">
          <TextInput
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </Field>
        <Field label="Public slug" hint={`Shown at ${publicPath}`}>
          <TextInput
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
        </Field>
      </div>
      <Field label="Bio">
        <TextArea
          rows={4}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="A short intro for your public author page"
        />
      </Field>
      <Field label="Website">
        <TextInput
          type="url"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          placeholder="https://"
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Instagram">
          <TextInput
            value={instagram}
            onChange={(event) => setInstagram(event.target.value)}
          />
        </Field>
        <Field label="X / Twitter">
          <TextInput
            value={twitter}
            onChange={(event) => setTwitter(event.target.value)}
          />
        </Field>
        <Field label="YouTube">
          <TextInput
            value={youtube}
            onChange={(event) => setYoutube(event.target.value)}
          />
        </Field>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {saved ? (
        <p className="text-sm text-neutral-600">Profile saved.</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <AdminButton type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save profile'}
        </AdminButton>
        <Link
          href={publicPath}
          className="border border-neutral-300 px-4 py-2 text-xs font-semibold tracking-wider uppercase text-neutral-700 transition-colors hover:border-neutral-950 hover:text-neutral-950"
        >
          View public page
        </Link>
      </div>
    </form>
  );
}
