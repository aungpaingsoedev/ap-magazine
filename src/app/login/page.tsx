import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteShell } from '@/components/layout/site-shell';

export default function LoginPage() {
  return (
    <SiteShell>
      <header className="sticky top-0 z-50 border-b-2 border-dashed border-ink/30 bg-[color-mix(in_srgb,var(--paper)_92%,white)]/95 backdrop-blur">
        <div className="site-pad flex items-center justify-between py-5">
          <Link href="/" className="font-display text-2xl text-ink">
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

      <main className="site-pad flex flex-1 items-center justify-center py-16">
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
    </SiteShell>
  );
}
