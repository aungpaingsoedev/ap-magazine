import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { getSiteSettings } from '@/lib/queries/taxonomy';
import { SignInDialog } from '@/components/auth/sign-in-dialog';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { SearchDialog } from '@/components/blog/search-dialog';
import { Avatar } from '@/components/ui/avatar';

export async function SiteHeader() {
  const [session, settings] = await Promise.all([getSession(), getSiteSettings()]);
  const siteName = settings?.siteName ?? 'AP Magazine';

  return (
    <header className="sticky top-0 z-50 border-b-2 border-dashed border-ink/30 bg-[color-mix(in_srgb,var(--paper)_92%,white)]/95 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--paper)_88%,white)]/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="font-display text-2xl text-ink sm:text-3xl"
        >
          {siteName}
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm font-medium text-ink transition-opacity hover:opacity-55">
              Magazine
            </Link>
            <Link href="/authors" className="text-sm font-medium text-ink transition-opacity hover:opacity-55">
              Authors
            </Link>
            <SearchDialog className="text-sm font-medium text-ink transition-opacity hover:opacity-55" />
            {session?.user ? (
              <>
                <Link href="/posts" className="text-sm font-medium text-ink transition-opacity hover:opacity-55">
                  My posts
                </Link>
                <Link href="/write" className="text-sm font-medium text-ink transition-opacity hover:opacity-55">
                  Write
                </Link>
              </>
            ) : (
              <SignInDialog
                className="text-sm font-medium text-ink transition-opacity hover:opacity-55"
              />
            )}
          </nav>

          {session?.user && (
            <div className="flex items-center gap-2 border-l-2 border-dashed border-ink/25 pl-3 sm:pl-4">
              <Link
                href="/profile"
                className="flex items-center gap-2 transition-opacity hover:opacity-60"
                title="My profile"
              >
                <span className="max-w-[8rem] truncate text-sm font-medium text-ink sm:max-w-[12rem]">
                  {session.user.name}
                </span>
                <Avatar
                  name={session.user.name}
                  image={session.user.image}
                  size="sm"
                />
              </Link>
              <SignOutButton compact />
            </div>
          )}

          {session?.user ? (
            <Link
              href="/write"
              className="font-display text-xs tracking-wider uppercase md:hidden"
            >
              Write
            </Link>
          ) : (
            <SignInDialog
              className="font-display text-xs tracking-wider uppercase md:hidden"
            />
          )}
        </div>
      </div>
    </header>
  );
}
