import { SiteHeader } from '@/components/layout/site-header';
import { WriteForm } from '@/components/blog/write-form';
import { getActiveCategories } from '@/lib/queries/taxonomy';

export default async function WritePage() {
  const categories = await getActiveCategories();

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-10 border-b border-neutral-200 pb-8">
          <p className="font-display text-xs font-bold tracking-[0.2em] text-neutral-500 uppercase">
            Contribute
          </p>
          <h1 className="font-display mt-3 text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
            Write
          </h1>
          <p className="mt-3 max-w-lg text-neutral-600">
            Share a story with the magazine. Published pieces appear on the
            front page grid.
          </p>
        </div>
        <div className="border border-neutral-200 p-6 sm:p-8">
          <WriteForm
            categories={categories.map((item) => ({
              id: item.id,
              name: item.name,
            }))}
          />
        </div>
      </main>
    </div>
  );
}
