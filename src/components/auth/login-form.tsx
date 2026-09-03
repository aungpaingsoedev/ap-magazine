'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  state_mismatch:
    'Sign-in session expired or was already used. Please try again — do not refresh the Google callback page.',
  internal_server_error: 'Something went wrong during sign-in. Please try again.',
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const authErrorCode = searchParams.get('error');
  const [error, setError] = useState<string | null>(
    authErrorCode
      ? (AUTH_ERROR_MESSAGES[authErrorCode] ??
          'Sign-in failed. Please try again.')
      : null,
  );
  const [loading, setLoading] = useState(false);

  const callbackURL = searchParams.get('callbackUrl') ?? '/';

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);

    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL,
    });

    if (result.error) {
      setError(result.error.message ?? 'Google sign-in failed');
      setLoading(false);
    }
  }

  return (
    <div className="border border-neutral-200 p-8">
      <button
        type="button"
        disabled={loading}
        onClick={signInWithGoogle}
        className="flex w-full items-center justify-center gap-3 border border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-semibold tracking-wide text-white uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        <GoogleIcon />
        {loading ? 'Redirecting...' : 'Continue with Google'}
      </button>
      {error && (
        <p className="mt-4 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
