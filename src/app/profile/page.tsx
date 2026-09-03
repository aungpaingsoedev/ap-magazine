import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { ProfileForm } from '@/components/profile/profile-form';
import { getSession } from '@/lib/auth/session';
import { getUserProfileById } from '@/lib/queries/profile';

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login?callbackUrl=/profile');
  }

  const profile = await getUserProfileById(session.user.id);
  if (!profile) {
    redirect('/login?callbackUrl=/profile');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-10 border-b-2 border-dashed border-ink/30 pb-8">
          <p className="font-display text-sm tracking-[0.18em] text-teal uppercase">
            Account
          </p>
          <h1 className="font-display hero-sketch-title mt-3 text-4xl tracking-tight text-ink sm:text-5xl">
            Profile
          </h1>
          <p className="mt-3 max-w-lg text-muted">
            Update your photo, display name, and account details.
          </p>
        </div>

        <section className="sketch-frame p-6 sm:p-8">
          <ProfileForm profile={profile} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
