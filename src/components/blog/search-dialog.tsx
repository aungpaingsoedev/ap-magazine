'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import {
  searchArticles,
  type SearchArticleHit,
} from '@/actions/blog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatMagazineDate } from '@/lib/blog-utils';
import { MediaImage } from '@/components/ui/media-image';

export function SearchDialog({
  className,
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchArticleHit[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }

    setPending(true);
    try {
      const hits = await searchArticles(q);
      setResults(hits);
      setSearched(true);
    } finally {
      setPending(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery('');
      setResults([]);
      setSearched(false);
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className={className}>
          Search
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>
            Find published stories across the magazine.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search published stories"
            className="w-full border-2 border-ink bg-[color-mix(in_srgb,var(--paper)_90%,white)] px-4 py-3.5 text-base text-ink [border-radius:0.35rem_0.8rem_0.4rem_0.7rem/0.7rem_0.35rem_0.8rem_0.45rem] focus:outline-none focus:ring-2 focus:ring-mustard/50"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full border-2 border-ink bg-mustard/40 px-4 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-80 disabled:opacity-60 [border-radius:0.35rem_0.8rem_0.4rem_0.7rem/0.7rem_0.35rem_0.8rem_0.45rem]"
          >
            {pending ? 'Searching…' : 'Search stories'}
          </button>
        </form>

        {searched ? (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto border-t-2 border-dashed border-ink/25 pt-4">
            <p className="text-sm text-muted">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </p>
            {results.length === 0 ? (
              <p className="py-4 text-sm text-muted">No stories matched that search.</p>
            ) : (
              <ul className="space-y-2">
                {results.map((hit) => (
                  <li key={hit.id}>
                    <Link
                      href={`/blog/${hit.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 border-2 border-ink/20 bg-[color-mix(in_srgb,var(--paper)_90%,white)] p-3 transition-opacity hover:opacity-80 [border-radius:0.35rem_0.8rem_0.4rem_0.7rem/0.7rem_0.35rem_0.8rem_0.45rem]"
                    >
                      {hit.coverImage ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-ink/20 bg-paper-deep">
                          <MediaImage
                            src={hit.coverImage}
                            alt=""
                            sizes="64px"
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-muted">
                          {hit.publishedAt ? (
                            <span>{formatMagazineDate(hit.publishedAt)}</span>
                          ) : null}
                          {hit.categoryName ? (
                            <span className="uppercase tracking-wide">{hit.categoryName}</span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate font-display text-lg text-ink">
                          {hit.title}
                        </p>
                        {hit.excerpt ? (
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                            {hit.excerpt}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
