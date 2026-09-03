# Atlas Magazine CMS

Next.js App Router magazine site with a protected editorial CMS.

## Stack

- Next.js 16 App Router (RSC + Server Actions)
- Neon PostgreSQL + Drizzle ORM
- Better Auth (Google OAuth) with RBAC
- Tiptap JSONB article bodies
- Local image uploads in `public/uploads`
- Socket.IO realtime feed updates when posts are published

## Run locally

```bash
npm install
npm run db:push
npm run dev
```

`npm run dev` starts the custom Node server (`server.ts`) with Next.js + Socket.IO on `/api/socketio`. Use `npm run dev:next` only if you want plain Next without realtime.

Required environment variables (`.env`):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
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

Seed emails use the `@seed.atlas.local` domain and are skipped if already present.

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

Public write at `/write` still works. Authors without publish permission save as drafts; editors/admins publish immediately.

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

Uploads are stored in `uploads/` at the project root (JPEG, PNG, WebP, GIF, max 5 MB) and served at `/uploads/<filename>`. The folder is gitignored. This is local disk storage; it is not durable on serverless hosts without a persistent volume.

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
- `/search`
- `/feed.xml`
- `/sitemap.xml`
