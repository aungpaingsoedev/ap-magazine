import Image from 'next/image';
import { cn } from '@/lib/utils';

type MediaImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
};

export function MediaImage({
  src,
  alt,
  className,
  sizes,
  priority = false,
  fill = true,
  width,
  height,
}: MediaImageProps) {
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn('object-cover', className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 96}
      height={height ?? 96}
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
    />
  );
}
