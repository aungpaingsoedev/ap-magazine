import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="font-display text-2xl font-bold text-neutral-950"
          >
            Atlas Magazine
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-neutral-950 transition-opacity hover:opacity-50"
          >
            Magazine
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h1 className="font-display text-5xl font-bold text-neutral-950">
              Sign in
            </h1>
            <p className="mt-3 text-sm text-neutral-600">
              Write, react, and join the conversation.
            </p>
          </div>
          <Suspense
            fallback={
              <div className="border border-neutral-200 p-8 text-center text-sm text-neutral-500">
                Loading...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
