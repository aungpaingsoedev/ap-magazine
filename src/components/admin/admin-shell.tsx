'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SignOutButton } from '@/components/auth/sign-out-button';
import type { Permission } from '@/lib/auth/session';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', permission: 'admin.access' },
  { href: '/admin/articles', label: 'Articles', permission: 'articles.create' },
  { href: '/admin/categories', label: 'Categories', permission: 'taxonomy.manage' },
  { href: '/admin/tags', label: 'Tags', permission: 'taxonomy.manage' },
  { href: '/admin/authors', label: 'Authors', permission: 'authors.manage' },
  { href: '/admin/media', label: 'Media Library', permission: 'media.manage' },
  { href: '/admin/comments', label: 'Comments', permission: 'comments.moderate' },
  { href: '/admin/users', label: 'Users', permission: 'users.manage' },
  { href: '/admin/settings', label: 'Settings', permission: 'settings.manage' },
  { href: '/admin/seo', label: 'SEO', permission: 'settings.manage' },
] as const;

type AdminShellProps = {
  userName: string;
  userEmail: string;
  permissions: Permission[];
  children: React.ReactNode;
};

export function AdminShell({
  userName,
  userEmail,
  permissions,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const allowed = NAV.filter((item) =>
    permissions.includes(item.permission as Permission),
  );

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-200 bg-white transition-transform lg:static lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center border-b border-neutral-200 px-5">
            <Link
              href="/admin/dashboard"
              className="font-display text-2xl font-bold"
            >
              Atlas CMS
            </Link>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {allowed.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2 text-sm ${
                    active
                      ? 'bg-neutral-950 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/"
              className="mt-4 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-950"
            >
              View magazine
            </Link>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:px-8">
            <button
              type="button"
              className="text-xs font-semibold tracking-wider uppercase lg:hidden"
              onClick={() => setOpen((value) => !value)}
            >
              Menu
            </button>
            <form action="/admin/articles" className="hidden flex-1 md:block">
              <input
                name="q"
                placeholder="Search articles"
                className="w-full max-w-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-950 focus:outline-none"
              />
            </form>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-neutral-500">{userEmail}</p>
              </div>
              <SignOutButton compact />
            </div>
          </header>
          <main className="flex-1 px-4 py-8 lg:px-8">{children}</main>
        </div>
      </div>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      ) : null}
    </div>
  );
}
