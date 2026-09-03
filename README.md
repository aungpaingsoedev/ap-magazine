# AP Magazine CMS

Next.js App Router magazine site with a protected editorial CMS.

## Stack

- Next.js 16 App Router (RSC + Server Actions)
- Supabase Postgres + Drizzle ORM
- Supabase Storage for cover/avatar/media uploads
- Better Auth (Google OAuth) with RBAC
- Tiptap JSONB article bodies
- Socket.IO realtime feed updates when posts are published

## Run locally

```bash
npm install
npm run db:push
npm run dev
```

`npm run dev` starts the custom Node server (`server.ts`) with Next.js + Socket.IO on `/api/socketio`. Use `npm run dev:next` only if you want plain Next without realtime.

### Supabase setup

1. Create a Supabase project.
2. Copy the **Database** connection string into `DATABASE_URL` (pooler URI is fine).
3. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose to the browser).
5. Create a **public** Storage bucket named `media` (or set `SUPABASE_STORAGE_BUCKET`).

Public read policy example (bucket `media`):

```sql
create policy "Public read media"
on storage.objects for select
using (bucket_id = 'media');
```

The app uploads with the service role key, so public **select** is what matters for displaying covers.

Required environment variables (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase Postgres connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for Storage uploads |
| `SUPABASE_STORAGE_BUCKET` | Optional. Defaults to `media` |
| `BETTER_AUTH_SECRET` | Auth secret |
| `BETTER_AUTH_URL` | Canonical app URL, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Public origin for auth client, sitemap, RSS |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `ADMIN_EMAIL` | Optional. First Google sign-in with this email is promoted to `admin` |
| `CRON_SECRET` | Optional. Bearer token for scheduled-publish cron |

## Seed demo content

Create 20 authors and one published post each:

```bash
npm run db:seed
```

Seed emails use the `@seed.ap.local` domain and are skipped if already present.

1. Set `ADMIN_EMAIL` to your Google account and sign in, **or**
2. After signing in once:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
```

## Roles

Existing roles are preserved. Mapping:

| Role | CMS access |
| --- | --- |
| `admin` | Everything (super admin) |
| `editor` | Articles (including publish), categories, tags, authors, media, comments |
| `author` | Create/edit own articles, submit for review, media |
| `media_manager` | Media library |
| `viewer` | Public site only |

Authorization is enforced in Server Actions and admin layouts, not only in the UI.

## Admin

Protected at `/admin` (cookie gate in middleware + server-side permission checks).

- `/admin/dashboard`
- `/admin/articles` · `/admin/articles/new` · `/admin/articles/[id]`
- `/admin/categories`
- `/admin/tags`
- `/admin/authors`
- `/admin/media`
- `/admin/comments`
- `/admin/users`
- `/admin/settings`
- `/admin/seo`

Public write at `/write` still works.

## Publishing

Article statuses: `draft`, `review`, `scheduled`, `published`, `archived`.

- **Publish** sets status to `published` and `publishedAt` to now.
- **Schedule** requires a future datetime. Status becomes `scheduled`.
- Due scheduled posts are published when public pages load, and by:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/publish
```

If `CRON_SECRET` is unset, the cron route is open — set it in production.

## Media

Uploads go to **Supabase Storage** (`media` bucket by default): JPEG, PNG, WebP, GIF, max 5 MB. The returned public URL is stored in the database.

## Database

```bash
npm run db:generate
npm run db:push
```

Default categories (`art`, `culture`, `design`, `essay`) and site settings are seeded on first CMS/homepage load.

## Public routes

- `/` magazine homepage
- `/blog/[slug]`
- `/authors` · `/authors/[slug]`
- `/category/[slug]`
- `/posts` · `/write` · `/write/[id]`
- `/feed.xml`
- `/sitemap.xml`
