import type { ReactNode } from 'react';
import Link from 'next/link';
import { can, getSession } from '@/lib/auth/session';
import { getSiteSettings } from '@/lib/queries/taxonomy';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Avatar } from '@/components/ui/avatar';

function SocialIcon({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center text-neutral-950 transition-opacity hover:opacity-50"
    >
      {children}
    </a>
  );
}

export async function SiteHeader() {
  const [session, settings] = await Promise.all([getSession(), getSiteSettings()]);
  const siteName = settings?.siteName ?? 'Atlas Magazine';
  const canAdmin = session?.user ? can(session.user, 'admin.access') : false;

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="font-display text-2xl font-bold text-neutral-950 sm:text-3xl"
        >
          {siteName}
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm font-medium text-neutral-950 transition-opacity hover:opacity-50">
              Magazine
            </Link>
            <Link href="/authors" className="text-sm font-medium text-neutral-950 transition-opacity hover:opacity-50">
              Authors
            </Link>
            <Link href="/search" className="text-sm font-medium text-neutral-950 transition-opacity hover:opacity-50">
              Search
            </Link>
            {canAdmin ? (
              <Link href="/admin" className="text-sm font-medium text-neutral-950 transition-opacity hover:opacity-50">
                CMS
              </Link>
            ) : null}
            {session?.user ? (
              <Link href="/write" className="text-sm font-medium text-neutral-950 transition-opacity hover:opacity-50">
                Write
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-medium text-neutral-950 transition-opacity hover:opacity-50">
                Sign in
              </Link>
            )}
          </nav>

          <div className="hidden h-4 w-px bg-neutral-300 sm:block" />

          <div className="hidden items-center sm:flex">
            <SocialIcon label="Instagram" href={settings?.instagram || '#'}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
              </svg>
            </SocialIcon>
            <SocialIcon label="X" href={settings?.twitter || '#'}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.19l-4.85-6.34L6.1 22H2.84l8.03-9.17L1.5 2h6.35l4.38 5.82L18.244 2zm-1.08 18.1h1.72L7.01 3.79H5.16L17.164 20.1z" />
              </svg>
            </SocialIcon>
            <SocialIcon label="YouTube" href={settings?.youtube || '#'}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
              </svg>
            </SocialIcon>
            <SocialIcon label="RSS" href="/feed.xml">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <circle cx="6.2" cy="17.8" r="2.2" />
                <path d="M4 4.5c8.5 0 15.5 7 15.5 15.5h-3.2C16.3 13.2 10.8 7.7 4 7.7V4.5z" />
                <path d="M4 10.5c5.2 0 9.5 4.3 9.5 9.5h-3.2c0-3.5-2.8-6.3-6.3-6.3V10.5z" />
              </svg>
            </SocialIcon>
          </div>

          {session?.user && (
            <div className="flex items-center gap-2 border-l border-neutral-200 pl-3 sm:pl-4">
              <Link
                href="/profile"
                className="flex items-center gap-2 transition-opacity hover:opacity-60"
                title="Profile"
              >
                <Avatar
                  name={session.user.name}
                  image={session.user.image}
                  size="sm"
                />
                <span className="hidden max-w-[8rem] truncate text-xs text-neutral-500 lg:inline">
                  {session.user.name}
                </span>
              </Link>
              <SignOutButton compact />
            </div>
          )}

          <Link
            href={session?.user ? '/write' : '/login'}
            className="font-display text-xs font-bold tracking-wider uppercase md:hidden"
          >
            {session?.user ? 'Write' : 'Sign in'}
          </Link>
        </div>
      </div>
    </header>
  );
}
