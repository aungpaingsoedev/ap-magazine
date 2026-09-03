import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { SiteFooter } from '@/components/layout/site-footer';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b-2 border-dashed border-ink/30 bg-[color-mix(in_srgb,var(--paper)_92%,white)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="font-display text-2xl text-ink"
          >
            AP Magazine
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-ink transition-opacity hover:opacity-55"
          >
            Magazine
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h1 className="font-display hero-sketch-title text-5xl text-ink">
              Sign in
            </h1>
            <p className="mt-3 text-sm text-muted">
              Write, react, and join the conversation.
            </p>
          </div>
          <Suspense
            fallback={
              <div className="sketch-frame p-8 text-center text-sm text-muted">
                Loading...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
