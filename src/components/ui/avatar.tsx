import { cn } from '@/lib/utils';
import { MediaImage } from '@/components/ui/media-image';

type AvatarProps = {
  name?: string | null;
  image?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const SIZE = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-24 w-24 text-3xl',
} as const;

function initials(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}

export function Avatar({ name, image, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-paper-deep font-semibold text-ink',
        SIZE[size],
        className,
      )}
      aria-hidden={image ? undefined : true}
    >
      {image ? (
        <MediaImage
          src={image}
          alt={name ? `${name} avatar` : 'Avatar'}
          sizes={size === 'xl' ? '96px' : size === 'lg' ? '56px' : size === 'md' ? '40px' : '32px'}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </span>
  );
}
