import Link from 'next/link';
import { cn } from '@/lib/utils';

type MagazinePaginationProps = {
  page: number;
  totalPages: number;
  basePath: string;
  className?: string;
};

function hrefForPage(basePath: string, page: number) {
  if (page <= 1) return basePath === '' ? '/' : basePath;
  const joiner = basePath.includes('?') ? '&' : '?';
  return `${basePath === '' ? '/' : basePath}${joiner}page=${page}`;
}

function pageWindow(current: number, total: number) {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let i = current - 1; i <= current + 1; i += 1) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  return [...pages].sort((a, b) => a - b);
}

export function MagazinePagination({
  page,
  totalPages,
  basePath,
  className,
}: MagazinePaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 border-t-2 border-dashed border-ink/30 py-8',
        className,
      )}
    >
      <p className="text-xs tracking-[0.16em] text-muted uppercase">
        Page {page} of {totalPages}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={hrefForPage(basePath, page - 1)}
          aria-disabled={page <= 1}
          className={cn(
            'sketch-btn px-3 py-2 text-[10px] font-semibold tracking-[0.16em] uppercase',
            page <= 1 && 'pointer-events-none opacity-30',
          )}
        >
          Prev
        </Link>

        {pages.map((item, index) => {
          const prev = pages[index - 1];
          const showGap = prev !== undefined && item - prev > 1;
          return (
            <span key={item} className="flex items-center gap-2">
              {showGap ? (
                <span className="px-1 text-xs text-muted">…</span>
              ) : null}
              <Link
                href={hrefForPage(basePath, item)}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  'min-w-9 px-3 py-2 text-center text-[10px] font-semibold tracking-[0.16em] uppercase',
                  item === page ? 'sketch-btn-solid' : 'sketch-btn',
                )}
              >
                {item}
              </Link>
            </span>
          );
        })}

        <Link
          href={hrefForPage(basePath, page + 1)}
          aria-disabled={page >= totalPages}
          className={cn(
            'sketch-btn px-3 py-2 text-[10px] font-semibold tracking-[0.16em] uppercase',
            page >= totalPages && 'pointer-events-none opacity-30',
          )}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}
