'use client';

import { useState, useTransition } from 'react';
import { AdminButton } from '@/components/admin/fields';

type ConfirmButtonProps = {
  label: string;
  confirmTitle: string;
  confirmBody: string;
  confirmLabel?: string;
  variant?: 'solid' | 'outline' | 'ghost' | 'danger';
  onConfirm: () => Promise<{ success: boolean; error?: string } | void>;
};

export function ConfirmButton({
  label,
  confirmTitle,
  confirmBody,
  confirmLabel = 'Confirm',
  variant = 'outline',
  onConfirm,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (result && result.success === false) {
        setError(result.error ?? 'Something went wrong');
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <AdminButton type="button" variant={variant} onClick={() => setOpen(true)}>
        {label}
      </AdminButton>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md border border-neutral-200 bg-white p-6">
            <h2 className="font-display text-lg font-bold">{confirmTitle}</h2>
            <p className="mt-2 text-sm text-neutral-600">{confirmBody}</p>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <AdminButton
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </AdminButton>
              <AdminButton type="button" onClick={handleConfirm} disabled={pending}>
                {pending ? 'Working...' : confirmLabel}
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
