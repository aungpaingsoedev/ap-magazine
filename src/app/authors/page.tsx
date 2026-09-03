import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { Avatar } from '@/components/ui/avatar';
import { listAuthors } from '@/lib/queries/admin';

export default async function AuthorsPage() {
  const authors = (await listAuthors()).filter(
    (person) => person.active && person.role !== 'viewer',
  );

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
          Contributors
        </p>
        <h1 className="font-display mt-3 text-4xl font-black">Authors</h1>
        <div className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
          {authors.map((author) => (
            <Link
              key={author.id}
              href={`/authors/${author.slug ?? author.id}`}
              className="flex items-start justify-between gap-4 py-6 hover:opacity-70"
            >
              <div className="flex items-start gap-4">
                <Avatar name={author.name} image={author.image} size="lg" />
                <div>
                  <h2 className="font-display text-xl font-bold">{author.name}</h2>
                  {author.bio ? (
                    <p className="mt-2 max-w-2xl text-sm text-neutral-600">{author.bio}</p>
                  ) : null}
                </div>
              </div>
              <span className="text-xs font-semibold tracking-wider uppercase">View</span>
            </Link>
          ))}
          {authors.length === 0 ? (
            <p className="py-10 text-sm text-neutral-500">No authors yet.</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
