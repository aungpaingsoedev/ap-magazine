'use client';

import Link from 'next/link';

type CategoryOption = {
  name: string;
  slug: string;
};

type CategoryFilterProps = {
  categories: CategoryOption[];
  activeSlug?: string | null;
};

export function CategoryFilter({
  categories,
  activeSlug = null,
}: CategoryFilterProps) {
  const options = [
    { name: 'All', href: '/', active: !activeSlug },
    ...categories.map((item) => ({
      name: item.name,
      href: `/category/${item.slug}`,
      active: activeSlug === item.slug,
    })),
  ];

  return (
    <div className="flex flex-col gap-4 border-b-2 border-dashed border-ink/30 py-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-display text-sm tracking-[0.14em] text-ink uppercase">
        Categories
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className={`px-4 py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors duration-200 ${
              category.active
                ? 'sketch-btn-solid'
                : 'sketch-stamp hover:bg-mustard/20'
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
