CREATE TABLE IF NOT EXISTS "content_category" (
	"content_id" text NOT NULL,
	"category_id" text NOT NULL,
	CONSTRAINT "content_category_content_id_category_id_pk" PRIMARY KEY("content_id","category_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_category" ADD CONSTRAINT "content_category_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_category" ADD CONSTRAINT "content_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
INSERT INTO "content_category" ("content_id", "category_id")
SELECT "id", "category_id" FROM "content"
WHERE "category_id" IS NOT NULL
ON CONFLICT DO NOTHING;
