'use client';

import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { BlogCard } from '@/components/blog/blog-card';
import { CategoryFilter } from '@/components/blog/category-filter';
import { MagazinePagination } from '@/components/blog/magazine-pagination';
import {
  BLOG_CREATED_EVENT,
  type RealtimeBlogPost,
} from '@/lib/realtime/events';
import type { ReactionType } from '@/lib/db/schema';

export type MagazinePost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | string | null;
  authorName: string | null;
  authorImage?: string | null;
  authorSlug?: string | null;
  coverImage: string | null;
  category: string;
  featured?: boolean;
  editorsPick?: boolean;
  viewCount?: number;
  reactionCounts?: { type: ReactionType; count: number }[];
  userReaction?: ReactionType | null;
};

type MagazineFeedProps = {
  posts: MagazinePost[];
  categories: { name: string; slug: string }[];
  isSignedIn?: boolean;
  page?: number;
  totalPages?: number;
  basePath?: string;
  activeCategorySlug?: string | null;
};

function toMagazinePost(post: RealtimeBlogPost): MagazinePost {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    authorName: post.authorName,
    authorImage: null,
    authorSlug: null,
    coverImage: post.coverImage,
    category: post.category,
    featured: post.featured,
    editorsPick: post.editorsPick,
    viewCount: 0,
    reactionCounts: [],
    userReaction: null,
  };
}

export function MagazineFeed({
  posts,
  categories,
  isSignedIn = false,
  page = 1,
  totalPages = 1,
  basePath = '/',
  activeCategorySlug = null,
}: MagazineFeedProps) {
  const [livePosts, setLivePosts] = useState(posts);
  const [justArrived, setJustArrived] = useState<string | null>(null);

  useEffect(() => {
    setLivePosts(posts);
  }, [posts]);

  useEffect(() => {
    if (page !== 1 || activeCategorySlug) return;

    let socket: Socket | null = null;
    let cancelled = false;

    try {
      socket = io({
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
      });

      socket.on(BLOG_CREATED_EVENT, (payload: RealtimeBlogPost) => {
        if (cancelled) return;
        setLivePosts((prev) => {
          if (prev.some((item) => item.id === payload.id)) return prev;
          return [toMagazinePost(payload), ...prev];
        });
        setJustArrived(payload.id);
        window.setTimeout(() => {
          setJustArrived((current) => (current === payload.id ? null : current));
        }, 2400);
      });
    } catch {
      // Socket server unavailable (e.g. plain `next dev`) — feed still works via RSC.
    }

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [page, activeCategorySlug]);

  return (
    <section id="stories">
      <CategoryFilter categories={categories} activeSlug={activeCategorySlug} />

      {livePosts.length === 0 ? (
        <div className="border-2 border-dashed border-ink/35 px-6 py-20 text-center sketch-frame">
          <p className="font-display text-lg text-ink">
            {activeCategorySlug ? 'No stories in this category' : 'No posts yet'}
          </p>
          <p className="mt-2 text-sm text-muted">
            {activeCategorySlug
              ? 'Try another filter or publish a new piece.'
              : 'Sign in and write the first magazine story. New publishes appear here live.'}
          </p>
        </div>
      ) : (
        <div className="magazine-grid">
          {livePosts.map((post, index) => (
            <BlogCard
              key={post.id}
              id={post.id}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              publishedAt={post.publishedAt}
              authorName={post.authorName}
              authorImage={post.authorImage}
              authorSlug={post.authorSlug}
              coverImage={post.coverImage}
              category={post.category}
              featured={post.featured}
              editorsPick={post.editorsPick}
              viewCount={post.viewCount ?? 0}
              reactionCounts={post.reactionCounts}
              userReaction={post.userReaction ?? null}
              isSignedIn={isSignedIn}
              index={index}
              className={
                justArrived === post.id
                  ? 'bg-mustard/15 outline outline-2 outline-offset-[-2px] outline-ink'
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <MagazinePagination
        page={page}
        totalPages={totalPages}
        basePath={basePath}
      />
    </section>
  );
}
