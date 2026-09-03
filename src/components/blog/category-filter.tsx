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
    <div className="flex flex-col gap-4 border-b border-neutral-200 py-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-neutral-950 uppercase">
        Categories
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors duration-200 ${
              category.active
                ? 'border-neutral-950 bg-neutral-950 text-white'
                : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100'
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
