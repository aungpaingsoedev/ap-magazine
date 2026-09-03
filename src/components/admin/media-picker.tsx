'use client';

import { useEffect, useState } from 'react';
import { AdminButton, TextInput } from '@/components/admin/fields';
import type { Media } from '@/lib/db/schema';

type MediaPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const [items, setItems] = useState<Media[] | undefined>(undefined);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    fetch('/api/media')
      .then((response) => response.json())
      .then((data: { items?: Media[] }) => {
        if (!cancelled) setItems(data.items ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const filtered = (items ?? []).filter((item) => {
    const haystack = `${item.filename} ${item.alt ?? ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="font-display text-lg font-bold">Media library</h2>
          <AdminButton type="button" variant="ghost" onClick={onClose}>
            Close
          </AdminButton>
        </div>
        <div className="border-b border-neutral-200 px-5 py-3">
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search filename or alt text"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-3">
          {items === undefined ? (
            <p className="col-span-full text-sm text-neutral-500">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="col-span-full text-sm text-neutral-500">No media found.</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.url);
                  onClose();
                }}
                className="border border-neutral-200 p-2 text-left hover:border-neutral-950"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.alt ?? ''} className="aspect-square w-full object-cover grayscale" />
                <p className="mt-2 truncate text-xs text-neutral-600">{item.filename}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
