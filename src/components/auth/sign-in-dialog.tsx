'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const WELCOME_SIGNIN_KEY = 'ap:signin-welcome';

function useCallbackURL() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function SignInDialogBody({ callbackURL }: { callbackURL: string }) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Sign in</DialogTitle>
        <DialogDescription>
          Continue with Google to write, react, and join the conversation.
        </DialogDescription>
      </DialogHeader>
      <LoginForm callbackURL={callbackURL} />
    </DialogContent>
  );
}

export function SignInDialog({
  label = 'Sign in',
  className,
}: {
  label?: string;
  className?: string;
}) {
  const callbackURL = useCallbackURL();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={className}>
          {label}
        </button>
      </DialogTrigger>
      <SignInDialogBody callbackURL={callbackURL} />
    </Dialog>
  );
}

/** Opens once per browser session for guests when they first enter the site. */
export function WelcomeSignInDialog() {
  const pathname = usePathname();
  const callbackURL = useCallbackURL();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/login') return;
    try {
      if (sessionStorage.getItem(WELCOME_SIGNIN_KEY)) return;
    } catch {
      // sessionStorage blocked — still show the prompt this visit
    }
    setOpen(true);
  }, [pathname]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      try {
        sessionStorage.setItem(WELCOME_SIGNIN_KEY, '1');
      } catch {
        // ignore
      }
    }
  }

  if (pathname === '/login') return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <SignInDialogBody callbackURL={callbackURL} />
    </Dialog>
  );
}
