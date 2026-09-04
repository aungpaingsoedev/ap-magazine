import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const CONTENT_STATUSES = [
  'draft',
  'review',
  'scheduled',
  'published',
  'archived',
] as const;

export const USER_ROLES = [
  'admin',
  'editor',
  'author',
  'media_manager',
  'viewer',
] as const;

export const REACTION_TYPES = ['like', 'love', 'insightful'] as const;

export const COMMENT_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'spam',
] as const;

const ts = (name: string) =>
  integer(name, { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date());

const optionalTs = (name: string) =>
  integer(name, { mode: 'timestamp_ms' });

// ─── Better Auth tables ───────────────────────────────────────────────────────

export const user = sqliteTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'boolean' })
      .notNull()
      .default(false),
    image: text('image'),
    role: text('role', { enum: USER_ROLES }).notNull().default('author'),
    username: text('username'),
    slug: text('slug'),
    bio: text('bio'),
    website: text('website'),
    instagram: text('instagram'),
    twitter: text('twitter'),
    youtube: text('youtube'),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (table) => [
    uniqueIndex('user_username_uidx').on(table.username),
    uniqueIndex('user_slug_uidx').on(table.slug),
  ],
);

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: ts('created_at'),
  updatedAt: ts('updated_at'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = sqliteTable(
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
    accessTokenExpiresAt: optionalTs('access_token_expires_at'),
    refreshTokenExpiresAt: optionalTs('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (table) => [
    uniqueIndex('account_issuer_account_id_uidx').on(
      table.issuer,
      table.accountId,
    ),
  ],
);

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: optionalTs('created_at').$defaultFn(() => new Date()),
  updatedAt: optionalTs('updated_at').$defaultFn(() => new Date()),
});

// ─── CMS taxonomy ─────────────────────────────────────────────────────────────

export const category = sqliteTable(
  'category',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    image: text('image'),
    sortOrder: integer('sort_order').notNull().default(0),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (table) => [uniqueIndex('category_slug_uidx').on(table.slug)],
);

export const tag = sqliteTable(
  'tag',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (table) => [uniqueIndex('tag_slug_uidx').on(table.slug)],
);

// ─── CMS content ──────────────────────────────────────────────────────────────

export type RichTextDocument = {
  type: 'doc';
  content?: unknown[];
};

export const content = sqliteTable(
  'content',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    excerpt: text('excerpt'),
    coverImage: text('cover_image'),
    body: text('body', { mode: 'json' })
      .$type<RichTextDocument>()
      .notNull()
      .default({ type: 'doc', content: [] }),
    layout: text('layout', { mode: 'json' }).$type<Record<string, unknown>>(),
    status: text('status', { enum: CONTENT_STATUSES })
      .notNull()
      .default('draft'),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    editorsPick: integer('editors_pick', { mode: 'boolean' })
      .notNull()
      .default(false),
    displayOrder: integer('display_order').notNull().default(0),
    readingTime: integer('reading_time'),
    viewCount: integer('view_count').notNull().default(0),
    categoryId: text('category_id').references(() => category.id, {
      onDelete: 'set null',
    }),
    publishedAt: optionalTs('published_at'),
    scheduledAt: optionalTs('scheduled_at'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    seoImage: text('seo_image'),
    canonicalUrl: text('canonical_url'),
    noIndex: integer('no_index', { mode: 'boolean' }).notNull().default(false),
    noFollow: integer('no_follow', { mode: 'boolean' }).notNull().default(false),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
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

export const contentTag = sqliteTable(
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

export const contentCategory = sqliteTable(
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

export const contentRevision = sqliteTable(
  'content_revision',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    body: text('body', { mode: 'json' }).$type<RichTextDocument>().notNull(),
    createdBy: text('created_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    createdAt: ts('created_at'),
  },
  (table) => [index('content_revision_content_id_idx').on(table.contentId)],
);

export const comment = sqliteTable('comment', {
  id: text('id').primaryKey(),
  contentId: text('content_id')
    .notNull()
    .references(() => content.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  status: text('status', { enum: COMMENT_STATUSES })
    .notNull()
    .default('approved'),
  createdAt: ts('created_at'),
  updatedAt: ts('updated_at'),
});

export const reaction = sqliteTable(
  'reaction',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: text('type', { enum: REACTION_TYPES }).notNull(),
    createdAt: ts('created_at'),
  },
  (table) => [
    uniqueIndex('reaction_user_content_uidx').on(table.userId, table.contentId),
  ],
);

export const media = sqliteTable(
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
    createdAt: ts('created_at'),
  },
  (table) => [index('media_created_at_idx').on(table.createdAt)],
);

export const siteSettings = sqliteTable('site_settings', {
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
  updatedAt: ts('updated_at'),
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
export type ReactionType = (typeof REACTION_TYPES)[number];
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
export type User = typeof user.$inferSelect;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type Category = typeof category.$inferSelect;
export type Tag = typeof tag.$inferSelect;
export type Media = typeof media.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];
export type ContentRevision = typeof contentRevision.$inferSelect;
