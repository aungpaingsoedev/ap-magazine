'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        className="flex h-8 w-8 items-center justify-center text-neutral-950 transition-opacity hover:opacity-50"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
