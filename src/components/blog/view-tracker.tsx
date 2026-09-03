'use client';

import { useEffect, useRef } from 'react';
import { recordPostView } from '@/actions/views';

type ViewTrackerProps = {
  contentId: string;
};

export function ViewTracker({ contentId }: ViewTrackerProps) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current || !contentId) return;

    const key = `atlas:viewed:${contentId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage unavailable — still record once per mount
    }

    recorded.current = true;
    void recordPostView(contentId);
  }, [contentId]);

  return null;
}
