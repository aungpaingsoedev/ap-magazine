'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveSettings } from '@/actions/settings';
import { AdminButton, Field, TextArea, TextInput } from '@/components/admin/fields';
import type { SiteSettings } from '@/lib/db/schema';

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const result = await saveSettings({
      siteName: form.get('siteName'),
      description: form.get('description'),
      instagram: form.get('instagram'),
      twitter: form.get('twitter'),
      youtube: form.get('youtube'),
      footerText: form.get('footerText'),
      homepageHeadline: form.get('homepageHeadline'),
      articlesPerPage: form.get('articlesPerPage'),
      defaultSeoTitle: form.get('defaultSeoTitle'),
      defaultSeoDescription: form.get('defaultSeoDescription'),
      defaultSeoImage: form.get('defaultSeoImage') || null,
      logo: form.get('logo') || null,
      favicon: form.get('favicon') || null,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <Field label="Site name">
        <TextInput name="siteName" defaultValue={settings.siteName} required />
      </Field>
      <Field label="Description">
        <TextArea name="description" rows={3} defaultValue={settings.description ?? ''} />
      </Field>
      <Field label="Homepage headline">
        <TextInput name="homepageHeadline" defaultValue={settings.homepageHeadline ?? 'Magazine'} />
      </Field>
      <Field label="Footer text">
        <TextInput name="footerText" defaultValue={settings.footerText ?? ''} />
      </Field>
      <Field label="Articles per page">
        <TextInput
          name="articlesPerPage"
          type="number"
          defaultValue={settings.articlesPerPage}
        />
      </Field>
      <Field label="Instagram URL">
        <TextInput name="instagram" defaultValue={settings.instagram ?? ''} />
      </Field>
      <Field label="X / Twitter URL">
        <TextInput name="twitter" defaultValue={settings.twitter ?? ''} />
      </Field>
      <Field label="YouTube URL">
        <TextInput name="youtube" defaultValue={settings.youtube ?? ''} />
      </Field>
      <Field label="Logo path">
        <TextInput name="logo" defaultValue={settings.logo ?? ''} placeholder="/uploads/logo.png" />
      </Field>
      <Field label="Favicon path">
        <TextInput name="favicon" defaultValue={settings.favicon ?? ''} />
      </Field>
      <Field label="Default SEO title">
        <TextInput name="defaultSeoTitle" defaultValue={settings.defaultSeoTitle ?? ''} />
      </Field>
      <Field label="Default SEO description">
        <TextArea name="defaultSeoDescription" rows={3} defaultValue={settings.defaultSeoDescription ?? ''} />
      </Field>
      <Field label="Default SEO image">
        <TextInput name="defaultSeoImage" defaultValue={settings.defaultSeoImage ?? ''} />
      </Field>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {saved ? <p className="text-sm text-neutral-600">Settings saved.</p> : null}
      <AdminButton type="submit">Save settings</AdminButton>
    </form>
  );
}
