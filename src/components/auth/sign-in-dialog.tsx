'use client';

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

export function SignInDialog({
  label = 'Sign in',
  className,
}: {
  label?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const callbackURL = query ? `${pathname}?${query}` : pathname;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={className}>
          {label}
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>
            Continue with Google to write, react, and join the conversation.
          </DialogDescription>
        </DialogHeader>
        <LoginForm callbackURL={callbackURL} />
      </DialogContent>
    </Dialog>
  );
}
