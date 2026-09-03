import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { ProfileForm } from '@/components/profile/profile-form';
import { Avatar } from '@/components/ui/avatar';
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

  const publicPath = `/authors/${profile.slug ?? profile.id}`;

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-10 border-b border-neutral-200 pb-8">
          <p className="font-display text-xs font-bold tracking-[0.2em] text-neutral-500 uppercase">
            Account
          </p>
          <h1 className="font-display mt-3 text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
            Profile
          </h1>
          <p className="mt-3 max-w-lg text-neutral-600">
            Update how you appear across the magazine and on your public author
            page.
          </p>
        </div>

        <section className="mb-8 flex items-start gap-5 border border-neutral-200 p-6 sm:p-8">
          <Avatar name={profile.name} image={profile.image} size="xl" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-bold text-neutral-950">
              {profile.name}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">{profile.email}</p>
            {profile.bio ? (
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-4 text-sm text-neutral-400">No bio yet.</p>
            )}
            <div className="mt-5 flex flex-wrap gap-4 text-sm">
              {profile.website ? (
                <a className="underline" href={profile.website}>
                  Website
                </a>
              ) : null}
              {profile.instagram ? (
                <a className="underline" href={profile.instagram}>
                  Instagram
                </a>
              ) : null}
              {profile.twitter ? (
                <a className="underline" href={profile.twitter}>
                  X
                </a>
              ) : null}
              {profile.youtube ? (
                <a className="underline" href={profile.youtube}>
                  YouTube
                </a>
              ) : null}
              <Link href={publicPath} className="underline">
                Public page
              </Link>
            </div>
          </div>
        </section>

        <section className="border border-neutral-200 p-6 sm:p-8">
          <h2 className="font-display mb-6 text-lg font-bold">Edit profile</h2>
          <ProfileForm profile={profile} />
        </section>
      </main>
    </div>
  );
}
