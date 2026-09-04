import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteShell } from '@/components/layout/site-shell';
import { WriteForm } from '@/components/blog/write-form';
import { can, getSession } from '@/lib/auth/session';
import { getPostForEdit } from '@/lib/queries/blog';
import { getActiveCategories } from '@/lib/queries/taxonomy';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/write/${id}`);
  }

  const post = await getPostForEdit(id);
  if (!post) {
    notFound();
  }

  const canEdit =
    can(session.user, 'articles.update_any') ||
    (can(session.user, 'articles.update_own') &&
      post.createdBy === session.user.id);

  if (!canEdit) {
    notFound();
  }

  const categories = await getActiveCategories();

  return (
    <SiteShell>
      <SiteHeader />
      <main className="site-pad flex-1 py-10">
        <div className="mb-10 border-b-2 border-dashed border-ink/30 pb-8">
          <p className="font-display text-sm tracking-[0.18em] text-teal uppercase">
            Edit
          </p>
          <h1 className="font-display hero-sketch-title mt-3 text-4xl tracking-tight text-ink sm:text-5xl">
            Edit post
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Update your story, then save as draft or publish.
          </p>
          <Link
            href="/posts"
            className="mt-4 inline-block text-xs font-semibold tracking-wider uppercase underline decoration-dashed underline-offset-4"
          >
            Back to my posts
          </Link>
        </div>
        <div className="sketch-frame p-6 sm:p-8 lg:p-10">
          <WriteForm
            key={post.id}
            categories={categories.map((item) => ({
              id: item.id,
              name: item.name,
            }))}
            initial={{
              id: post.id,
              title: post.title,
              excerpt: post.excerpt,
              coverImage: post.coverImage,
              categoryIds: post.categoryIds,
              body: post.body,
              status: post.status,
            }}
          />
        </div>
      </main>
      <SiteFooter />
    </SiteShell>
  );
}
