import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteShell } from '@/components/layout/site-shell';
import { WriteForm } from '@/components/blog/write-form';
import { getActiveCategories } from '@/lib/queries/taxonomy';

export default async function WritePage() {
  const categories = await getActiveCategories();

  return (
    <SiteShell>
      <SiteHeader />
      <main className="site-pad flex-1 py-10">
        <div className="mb-10 border-b-2 border-dashed border-ink/30 pb-8">
          <p className="font-display text-sm tracking-[0.18em] text-teal uppercase">
            Contribute
          </p>
          <h1 className="font-display hero-sketch-title mt-3 text-4xl tracking-tight text-ink sm:text-5xl">
            Write
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Share a story with the magazine. Save a draft privately, or publish
            to appear on the front page.
          </p>
        </div>
        <div className="sketch-frame p-6 sm:p-8 lg:p-10">
          <WriteForm
            key="new-post"
            categories={categories.map((item) => ({
              id: item.id,
              name: item.name,
            }))}
          />
        </div>
      </main>
      <SiteFooter />
    </SiteShell>
  );
}
