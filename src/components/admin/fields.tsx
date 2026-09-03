import { cn } from '@/lib/utils';

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="font-display text-xs font-bold tracking-[0.16em] text-neutral-950 uppercase">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs text-neutral-500">{hint}</span> : null}
    </label>
  );
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none',
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-950 focus:border-neutral-950 focus:outline-none',
        className,
      )}
      {...props}
    />
  );
}

export function AdminButton({
  className,
  variant = 'solid',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'outline' | 'ghost' | 'danger';
}) {
  const styles = {
    solid:
      'border border-neutral-950 bg-neutral-950 text-white hover:opacity-80',
    outline:
      'border border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-50',
    ghost: 'border border-transparent text-neutral-700 hover:bg-neutral-100',
    danger: 'border border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-wider uppercase disabled:opacity-40',
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function StatusPill({ status }: { status: string }) {
  const published = status === 'published';
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase',
        published
          ? 'border-neutral-950 bg-neutral-950 text-white'
          : 'border-neutral-950 text-neutral-950',
      )}
    >
      {status}
    </span>
  );
}
