import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteShell } from '@/components/layout/site-shell';
import { Avatar } from '@/components/ui/avatar';
import { getSession } from '@/lib/auth/session';
import { listAuthors } from '@/lib/queries/admin';

export default async function AuthorsPage() {
  const session = await getSession();
  const authors = (await listAuthors()).filter(
    (person) =>
      person.active &&
      person.role !== 'viewer' &&
      person.id !== session?.user?.id,
  );

  return (
    <SiteShell>
      <SiteHeader />
      <main className="site-pad flex-1 py-12">
        <p className="font-display text-sm tracking-[0.18em] text-teal uppercase">
          Contributors
        </p>
        <h1 className="font-display hero-sketch-title mt-3 text-4xl text-ink sm:text-5xl">
          Authors
        </h1>
        <div className="mt-10 divide-y-2 divide-dashed divide-ink/20 border-y-2 border-dashed border-ink/30">
          {authors.map((author) => (
            <Link
              key={author.id}
              href={`/authors/${author.slug ?? author.id}`}
              className="flex items-start justify-between gap-4 py-6 hover:opacity-70"
            >
              <div className="flex items-start gap-4">
                <Avatar name={author.name} image={author.image} size="lg" />
                <div>
                  <h2 className="font-display text-xl text-ink">{author.name}</h2>
                  {author.bio ? (
                    <p className="mt-2 max-w-2xl text-sm text-muted">{author.bio}</p>
                  ) : null}
                </div>
              </div>
              <span className="sketch-stamp px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                View
              </span>
            </Link>
          ))}
          {authors.length === 0 ? (
            <p className="py-10 text-sm text-muted">No authors yet.</p>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </SiteShell>
  );
}
