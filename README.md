# AP Magazine CMS

Next.js App Router magazine site with a protected editorial CMS.

## Stack

- Next.js 16 App Router (RSC + Server Actions)
- SQLite + Drizzle ORM (`data/cms.db`)
- Local disk uploads (`uploads/` served at `/uploads/...`)
- Better Auth (Google OAuth) with RBAC
- Tiptap JSON article bodies

## Run locally

```bash
npm install
npm run db:push
npm run dev
```

Uploads are stored in `uploads/` and served through `/api/files`. The SQLite database lives at `data/cms.db` by default (override with `DATABASE_URL`).

### Docker (port 3031)

```bash
# Build & start (runs drizzle-kit push on every start)
docker compose up -d --build

# Schema only
npm run docker:db:push
# or: docker compose run --rm db-push

# Demo seed (safe / skip existing)
npm run docker:db:seed
# or: docker compose run --rm db-seed

# Wipe seed users and reseed
npm run docker:db:seed:force
```

App: http://localhost:3031

Optional: set `SEED_ON_START=1` in `.env` to seed demo data automatically when the app container starts.

SQLite and uploads persist in Docker volumes. For Google OAuth, add redirect URI:

`http://localhost:3031/api/auth/callback/google`

Compose defaults auth URLs to `http://localhost:3031` (overrides `.env` localhost:3000).

### Auth setup

1. Create a Google OAuth client.
2. Set authorized redirect URI to `{APP_URL}/api/auth/callback/google`.
3. Copy client ID/secret into `.env`.
4. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the same public origin (e.g. `http://localhost:3000`).

Required environment variables (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Optional. SQLite file path. Defaults to `./data/cms.db` |
| `BETTER_AUTH_SECRET` | Auth secret |
| `BETTER_AUTH_URL` | Canonical app URL. Local: `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Same public origin (sitemap/RSS/trusted origins) |
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

Uploads go to the local `uploads/` folder: JPEG, PNG, WebP, GIF, max 5 MB. Public URLs look like `/uploads/<id>.jpg`.

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

## Hosting note

SQLite and local uploads need a persistent filesystem (local machine, VPS, Docker volume). Ephemeral serverless hosts (default Vercel) will not keep `data/cms.db` or `uploads/` between deploys.
