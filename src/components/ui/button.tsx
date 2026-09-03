import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [border-radius:0.3rem_0.7rem_0.35rem_0.65rem/0.65rem_0.3rem_0.7rem_0.4rem]',
  {
    variants: {
      variant: {
        default:
          'border-2 border-ink bg-ink text-paper shadow-[2px_2px_0_color-mix(in_srgb,var(--coral)_35%,transparent)] hover:bg-charcoal',
        destructive: 'border-2 border-coral bg-coral text-paper hover:opacity-90',
        outline:
          'border-2 border-ink bg-[color-mix(in_srgb,var(--paper)_90%,white)] text-ink shadow-[2px_2px_0_color-mix(in_srgb,var(--ink)_14%,transparent)] hover:bg-mustard/20',
        secondary:
          'border-2 border-ink/40 bg-paper-deep text-ink hover:bg-mustard/15',
        ghost: 'hover:bg-ink/5 text-ink',
        link: 'text-ink underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { Button, buttonVariants };
