CREATE TYPE "public"."comment_status" AS ENUM('pending', 'approved', 'rejected', 'spam');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'media_manager' BEFORE 'viewer';--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"content_id" text NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body" jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_tag" (
	"content_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "content_tag_content_id_tag_id_pk" PRIMARY KEY("content_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"filename" text NOT NULL,
	"alt" text,
	"mime_type" text NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"width" integer,
	"height" integer,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"site_name" text DEFAULT 'Atlas Magazine' NOT NULL,
	"logo" text,
	"favicon" text,
	"description" text,
	"instagram" text,
	"twitter" text,
	"youtube" text,
	"footer_text" text,
	"homepage_headline" text DEFAULT 'Magazine',
	"articles_per_page" integer DEFAULT 12 NOT NULL,
	"default_seo_title" text,
	"default_seo_description" text,
	"default_seo_image" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "status" "comment_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "editors_pick" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "reading_time" integer;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "category_id" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "seo_image" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "canonical_url" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "no_index" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "no_follow" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "instagram" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "twitter" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "youtube" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "content_revision" ADD CONSTRAINT "content_revision_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_revision" ADD CONSTRAINT "content_revision_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tag" ADD CONSTRAINT "content_tag_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tag" ADD CONSTRAINT "content_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "category_slug_uidx" ON "category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_revision_content_id_idx" ON "content_revision" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_slug_uidx" ON "tag" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_status_idx" ON "content" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_published_at_idx" ON "content" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "content_created_by_idx" ON "content" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "content_category_id_idx" ON "content" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_uidx" ON "user" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "user_slug_uidx" ON "user" USING btree ("slug");