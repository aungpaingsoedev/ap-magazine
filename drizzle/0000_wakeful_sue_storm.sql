CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`issuer` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_issuer_account_id_uidx` ON `account` (`issuer`,`account_id`);--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`image` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_slug_uidx` ON `category` (`slug`);--> statement-breakpoint
CREATE TABLE `comment` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`user_id` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'approved' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `content` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`excerpt` text,
	`cover_image` text,
	`body` text DEFAULT '{"type":"doc","content":[]}' NOT NULL,
	`layout` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`editors_pick` integer DEFAULT false NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`reading_time` integer,
	`view_count` integer DEFAULT 0 NOT NULL,
	`category_id` text,
	`published_at` integer,
	`scheduled_at` integer,
	`seo_title` text,
	`seo_description` text,
	`seo_image` text,
	`canonical_url` text,
	`no_index` integer DEFAULT false NOT NULL,
	`no_follow` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_slug_unique` ON `content` (`slug`);--> statement-breakpoint
CREATE INDEX `content_status_idx` ON `content` (`status`);--> statement-breakpoint
CREATE INDEX `content_published_at_idx` ON `content` (`published_at`);--> statement-breakpoint
CREATE INDEX `content_created_by_idx` ON `content` (`created_by`);--> statement-breakpoint
CREATE INDEX `content_category_id_idx` ON `content` (`category_id`);--> statement-breakpoint
CREATE TABLE `content_category` (
	`content_id` text NOT NULL,
	`category_id` text NOT NULL,
	PRIMARY KEY(`content_id`, `category_id`),
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `content_revision` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`version` integer NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`body` text NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `content_revision_content_id_idx` ON `content_revision` (`content_id`);--> statement-breakpoint
CREATE TABLE `content_tag` (
	`content_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`content_id`, `tag_id`),
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`filename` text NOT NULL,
	`alt` text,
	`mime_type` text NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`width` integer,
	`height` integer,
	`uploaded_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `media_created_at_idx` ON `media` (`created_at`);--> statement-breakpoint
CREATE TABLE `reaction` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reaction_user_content_uidx` ON `reaction` (`user_id`,`content_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`site_name` text DEFAULT 'AP Magazine' NOT NULL,
	`logo` text,
	`favicon` text,
	`description` text,
	`instagram` text,
	`twitter` text,
	`youtube` text,
	`footer_text` text,
	`homepage_headline` text DEFAULT 'Magazine',
	`articles_per_page` integer DEFAULT 12 NOT NULL,
	`default_seo_title` text,
	`default_seo_description` text,
	`default_seo_image` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_slug_uidx` ON `tag` (`slug`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'author' NOT NULL,
	`username` text,
	`slug` text,
	`bio` text,
	`website` text,
	`instagram` text,
	`twitter` text,
	`youtube` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_uidx` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_slug_uidx` ON `user` (`slug`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
