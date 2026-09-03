import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { DeletePostButton } from '@/components/blog/delete-post-button';
import { MediaImage } from '@/components/ui/media-image';
import { formatMagazineDate } from '@/lib/blog-utils';
import { getSession } from '@/lib/auth/session';
import { listOwnPosts } from '@/lib/queries/blog';

function statusLabel(status: string) {
  if (status === 'published') return 'Public';
  if (status === 'draft') return 'Draft';
  return status;
}

export default async function PostsPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login?callbackUrl=/posts');
  }

  const posts = await listOwnPosts(session.user.id);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-dashed border-ink/30 pb-8">
          <div>
            <p className="font-display text-sm tracking-[0.18em] text-teal uppercase">
              Library
            </p>
            <h1 className="font-display hero-sketch-title mt-3 text-4xl tracking-tight text-ink sm:text-5xl">
              My posts
            </h1>
            <p className="mt-3 max-w-xl text-muted">
              Drafts stay private. Published stories appear on the magazine.
            </p>
          </div>
          <Link
            href="/write"
            className="sketch-btn-solid px-5 py-2.5 text-xs font-semibold tracking-wider uppercase"
          >
            New post
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="sketch-frame p-8 text-center sm:p-12">
            <p className="text-muted">You have not written any posts yet.</p>
            <Link
              href="/write"
              className="mt-4 inline-block text-sm font-semibold tracking-wider uppercase underline decoration-dashed underline-offset-4"
            >
              Write your first story
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <div className="flex flex-col gap-4 border-2 border-ink/20 bg-[color-mix(in_srgb,var(--paper)_90%,white)] p-4 sm:flex-row sm:items-center [border-radius:0.35rem_0.8rem_0.4rem_0.7rem/0.7rem_0.35rem_0.8rem_0.45rem]">
                  {post.coverImage ? (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-ink/20 bg-paper-deep sm:h-24 sm:w-24">
                      <MediaImage
                        src={post.coverImage}
                        alt=""
                        sizes="96px"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="font-semibold tracking-wider uppercase text-ink">
                        {statusLabel(post.status)}
                      </span>
                      {post.categoryName ? <span>{post.categoryName}</span> : null}
                      <span>
                        Updated {formatMagazineDate(post.updatedAt) || '—'}
                      </span>
                    </div>
                    <h2 className="mt-1 truncate font-display text-2xl text-ink">
                      {post.title}
                    </h2>
                    {post.excerpt ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {post.excerpt}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                    <Link
                      href={`/write/${post.id}`}
                      className="sketch-btn-solid px-4 py-2 text-center text-[10px] font-semibold tracking-wider uppercase"
                    >
                      Edit
                    </Link>
                    {post.status === 'published' ? (
                      <Link
                        href={`/blog/${post.slug}`}
                        className="sketch-btn px-4 py-2 text-center text-[10px] font-semibold tracking-wider uppercase"
                      >
                        View
                      </Link>
                    ) : null}
                    <DeletePostButton postId={post.id} title={post.title} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
