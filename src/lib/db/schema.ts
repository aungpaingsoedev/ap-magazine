import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/** Content lifecycle statuses */
export const contentStatusEnum = pgEnum('content_status', [
  'draft',
  'review',
  'scheduled',
  'published',
  'archived',
]);

/**
 * RBAC roles (existing values preserved).
 * admin ≈ super admin, editor, author ≈ writer, media_manager, viewer
 */
export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'editor',
  'author',
  'media_manager',
  'viewer',
]);

/** Reaction types for blog posts */
export const reactionTypeEnum = pgEnum('reaction_type', [
  'like',
  'love',
  'insightful',
]);

export const commentStatusEnum = pgEnum('comment_status', [
  'pending',
  'approved',
  'rejected',
  'spam',
]);

// ─── Better Auth tables ───────────────────────────────────────────────────────

export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    role: userRoleEnum('role').notNull().default('author'),
    username: text('username'),
    slug: text('slug'),
    bio: text('bio'),
    website: text('website'),
    instagram: text('instagram'),
    twitter: text('twitter'),
    youtube: text('youtube'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('user_username_uidx').on(table.username),
    uniqueIndex('user_slug_uidx').on(table.slug),
  ],
);

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    issuer: text('issuer').notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('account_issuer_account_id_uidx').on(
      table.issuer,
      table.accountId,
    ),
  ],
);

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── CMS taxonomy ─────────────────────────────────────────────────────────────

export const category = pgTable(
  'category',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    image: text('image'),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex('category_slug_uidx').on(table.slug)],
);

export const tag = pgTable(
  'tag',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex('tag_slug_uidx').on(table.slug)],
);

// ─── CMS content ──────────────────────────────────────────────────────────────

export type RichTextDocument = {
  type: 'doc';
  content?: unknown[];
};

export const content = pgTable(
  'content',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    excerpt: text('excerpt'),
    coverImage: text('cover_image'),
    body: jsonb('body').$type<RichTextDocument>().notNull().default({
      type: 'doc',
      content: [],
    }),
    layout: jsonb('layout').$type<Record<string, unknown>>(),
    status: contentStatusEnum('status').notNull().default('draft'),
    featured: boolean('featured').notNull().default(false),
    editorsPick: boolean('editors_pick').notNull().default(false),
    displayOrder: integer('display_order').notNull().default(0),
    readingTime: integer('reading_time'),
    viewCount: integer('view_count').notNull().default(0),
    categoryId: text('category_id').references(() => category.id, {
      onDelete: 'set null',
    }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    seoImage: text('seo_image'),
    canonicalUrl: text('canonical_url'),
    noIndex: boolean('no_index').notNull().default(false),
    noFollow: boolean('no_follow').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdBy: text('created_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    updatedBy: text('updated_by').references(() => user.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('content_status_idx').on(table.status),
    index('content_published_at_idx').on(table.publishedAt),
    index('content_created_by_idx').on(table.createdBy),
    index('content_category_id_idx').on(table.categoryId),
  ],
);

export const contentTag = pgTable(
  'content_tag',
  {
    contentId: text('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tag.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.contentId, table.tagId] })],
);

export const contentCategory = pgTable(
  'content_category',
  {
    contentId: text('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => category.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.contentId, table.categoryId] })],
);

export const contentRevision = pgTable(
  'content_revision',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    body: jsonb('body').$type<RichTextDocument>().notNull(),
    createdBy: text('created_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('content_revision_content_id_idx').on(table.contentId)],
);

export const comment = pgTable('comment', {
  id: text('id').primaryKey(),
  contentId: text('content_id')
    .notNull()
    .references(() => content.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  status: commentStatusEnum('status').notNull().default('approved'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reaction = pgTable(
  'reaction',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: reactionTypeEnum('type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('reaction_user_content_uidx').on(table.userId, table.contentId),
  ],
);

export const media = pgTable(
  'media',
  {
    id: text('id').primaryKey(),
    url: text('url').notNull(),
    filename: text('filename').notNull(),
    alt: text('alt'),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull().default(0),
    width: integer('width'),
    height: integer('height'),
    uploadedBy: text('uploaded_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('media_created_at_idx').on(table.createdAt)],
);

export const siteSettings = pgTable('site_settings', {
  id: text('id').primaryKey(),
  siteName: text('site_name').notNull().default('AP Magazine'),
  logo: text('logo'),
  favicon: text('favicon'),
  description: text('description'),
  instagram: text('instagram'),
  twitter: text('twitter'),
  youtube: text('youtube'),
  footerText: text('footer_text'),
  homepageHeadline: text('homepage_headline').default('Magazine'),
  articlesPerPage: integer('articles_per_page').notNull().default(12),
  defaultSeoTitle: text('default_seo_title'),
  defaultSeoDescription: text('default_seo_description'),
  defaultSeoImage: text('default_seo_image'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  articles: many(content, { relationName: 'contentAuthor' }),
  comments: many(comment),
  media: many(media),
}));

export const categoryRelations = relations(category, ({ many }) => ({
  articles: many(content),
  contentCategories: many(contentCategory),
}));

export const tagRelations = relations(tag, ({ many }) => ({
  articles: many(contentTag),
}));

export const contentTagRelations = relations(contentTag, ({ one }) => ({
  article: one(content, {
    fields: [contentTag.contentId],
    references: [content.id],
  }),
  tag: one(tag, {
    fields: [contentTag.tagId],
    references: [tag.id],
  }),
}));

export const contentCategoryRelations = relations(contentCategory, ({ one }) => ({
  article: one(content, {
    fields: [contentCategory.contentId],
    references: [content.id],
  }),
  category: one(category, {
    fields: [contentCategory.categoryId],
    references: [category.id],
  }),
}));

export const commentRelations = relations(comment, ({ one }) => ({
  post: one(content, {
    fields: [comment.contentId],
    references: [content.id],
  }),
  author: one(user, {
    fields: [comment.userId],
    references: [user.id],
  }),
}));

export const reactionRelations = relations(reaction, ({ one }) => ({
  post: one(content, {
    fields: [reaction.contentId],
    references: [content.id],
  }),
  user: one(user, {
    fields: [reaction.userId],
    references: [user.id],
  }),
}));

export const contentRevisionRelations = relations(contentRevision, ({ one }) => ({
  article: one(content, {
    fields: [contentRevision.contentId],
    references: [content.id],
  }),
  editor: one(user, {
    fields: [contentRevision.createdBy],
    references: [user.id],
  }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  uploader: one(user, {
    fields: [media.uploadedBy],
    references: [user.id],
  }),
}));

export const contentRelations = relations(content, ({ one, many }) => ({
  author: one(user, {
    fields: [content.createdBy],
    references: [user.id],
    relationName: 'contentAuthor',
  }),
  editor: one(user, {
    fields: [content.updatedBy],
    references: [user.id],
    relationName: 'contentEditor',
  }),
  category: one(category, {
    fields: [content.categoryId],
    references: [category.id],
  }),
  comments: many(comment),
  reactions: many(reaction),
  tags: many(contentTag),
  categories: many(contentCategory),
  revisions: many(contentRevision),
}));

export type Comment = typeof comment.$inferSelect;
export type Reaction = typeof reaction.$inferSelect;
export type ReactionType = (typeof reactionTypeEnum.enumValues)[number];
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
export type User = typeof user.$inferSelect;
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type Category = typeof category.$inferSelect;
export type Tag = typeof tag.$inferSelect;
export type Media = typeof media.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type CommentStatus = (typeof commentStatusEnum.enumValues)[number];
export type ContentRevision = typeof contentRevision.$inferSelect;
