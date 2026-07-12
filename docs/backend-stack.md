# Backend Stack

The backend is a TypeScript Express API in `backend/`. It is the **only**
client of Supabase — the frontend never touches the database or storage
directly. Express holds the Supabase secret (service-role) key, which bypasses
Row Level Security, so it must never be exposed to the browser.

```
Visitor / Admin ──► Frontend (Vite + React, Vercel)
                         │  fetch('/api/...')
                         ▼
                    Express API (Vercel serverless)
                         │  @supabase/supabase-js (secret key)
                         ▼
                    Supabase ── Postgres
                             └─ Storage ('photos' bucket, public read)
```

## Stack at a glance

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node.js (LTS) + TypeScript 6 | Strict mode, config extends `@tsconfig/node-lts` |
| Framework | Express 5 | ESM (`import`/`export`) throughout |
| Database + storage | Supabase (`@supabase/supabase-js`) | One client for Postgres queries **and** Storage |
| Auth | `bcryptjs` + `jsonwebtoken` | Single admin password → 8-hour JWT; no Supabase Auth |
| Uploads | `multer` (in-memory) | Multipart photos → Supabase Storage |
| Middleware | `cors`, `morgan` | CORS locked to `FRONTEND_URL` |
| Dev runner | `tsx watch` | Auto-restarts on file changes |

## Directory layout

```
backend/
├── schema.sql              # Canonical DB schema — tables, RLS policies, seed data
├── tsconfig.json           # Strict TS, src/ → dist/
├── vercel.json             # Builds src/index.ts with @vercel/node
├── .env.example            # Template for required env vars
├── .env                    # Your local values (git-ignored, never commit)
└── src/
    ├── index.ts            # App entry: env checks, middleware, route mounting
    ├── types.ts            # Shared row/request types
    ├── db/supabase.ts      # The single shared Supabase client
    ├── middleware/auth.ts  # authenticateAdmin — verifies the Bearer JWT
    └── routes/
        ├── auth.ts         # POST /api/auth/login
        ├── schedule.ts     # /api/schedule + /api/schedule/days
        ├── gallery.ts      # /api/gallery (years, photos, uploads, replace, reorder)
        ├── team.ts         # /api/team (members, photo/badge uploads, reorder)
        ├── companies.ts    # /api/companies (team badges + sponsors, logo upload, reorder)
        └── settings.ts     # /api/settings (site settings key/value store)
```

## API surface

- `GET /api/health` — health check
- `POST /api/auth/login` — password in, `{ token }` out (JWT, 8 h expiry)
- `GET /api/schedule`, `GET /api/schedule/days` — public reads
- `POST/PUT/DELETE /api/schedule/...` — admin only
- `GET /api/gallery` — public; year/photo writes, uploads, replaces, and
  `PUT /api/gallery/photos/reorder` admin only
- `GET /api/team` — public; member writes, photo/badge uploads, and
  `PUT /api/team/reorder` (display priority) admin only
- `GET /api/companies` — public; a row is a reusable team badge and becomes a
  sponsor when it has a `sponsor_tier`. CRUD with logo upload and
  `PUT /api/companies/reorder` (tier display order) admin only
- `GET /api/settings` — public read of all site settings (e.g.
  `countdown_target`, `mlh_badge_enabled`); `PUT /api/settings/:key` admin only

"Admin only" routes use the `authenticateAdmin` middleware, which verifies the
`Authorization: Bearer <token>` header against `JWT_SECRET`.

## Environment variables

`src/index.ts` validates these at boot and **exits immediately** if any is
missing. Copy the template and fill it in:

```bash
cd backend
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `PORT` | Local port (optional, defaults to 3000) |
| `JWT_SECRET` | Signs admin JWTs — any long random string |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password (see below) |
| `FRONTEND_URL` | CORS allowlist origin, e.g. `http://localhost:5173` |
| `SUPABASE_URL` | Supabase project URL (local or cloud) |
| `SUPABASE_SECRET_KEY` | Supabase secret / service-role key — server-side only |

Generate values:

```bash
# ADMIN_PASSWORD_HASH — bcrypt-hash your chosen admin password
node -e "console.log(require('bcryptjs').hashSync('your-password-here', 10))"

# JWT_SECRET — random 64-char hex string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run those from inside `backend/` so `bcryptjs` resolves.

## Running locally

```bash
cd backend
npm install
npm run dev          # tsx watch — restarts on save, serves http://localhost:3000
```

Other scripts:

```bash
npm run build        # tsc → dist/
npm start            # run the compiled build (node dist/index.js)
```

Sanity check once it's up:

```bash
curl http://localhost:3000/api/health     # → {"status":"ok"}
```

## Supabase for local testing

The repo has a Supabase CLI project configured in `supabase/`
(`config.toml`, `migrations/`). This runs a full local Supabase stack in
Docker so you can develop and test without touching the shared cloud project.

### One-time setup

1. Install **Docker Desktop** and make sure it's running.
2. Install the Supabase CLI. On Windows the easiest routes are:

   ```powershell
   scoop install supabase        # via Scoop
   ```

   or run it through npx without installing globally:

   ```bash
   npx supabase --version
   ```

### Daily workflow

```bash
# From the repo root (where supabase/config.toml lives)
npx supabase start        # boots Postgres, API, Studio in Docker (slow first time)
npx supabase status       # prints URLs and keys any time you need them
```

`supabase start` prints (and `status` re-prints) everything you need:

- **API URL** → `http://127.0.0.1:54321` — use as `SUPABASE_URL`
- **service_role key** → use as `SUPABASE_SECRET_KEY`
- **Studio** → `http://127.0.0.1:54323` — web UI to browse tables and storage
- **DB** → `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Point `backend/.env` at those two values and start the backend as usual. To
switch back to the cloud project, just change the two env vars back — no code
changes.

```bash
npx supabase stop         # shut the stack down (data persists)
npx supabase stop --no-backup   # shut down AND wipe local data
```

### Migrations and schema changes

Schema lives in two places, deliberately:

- `supabase/migrations/*.sql` — ordered migration files the CLI applies.
  Currently: initial schema, the `photos` storage bucket and its policies,
  the `companies` table + member badge columns, and the sponsor fields +
  `site_settings` table.
- `backend/schema.sql` — the flat, human-readable canonical schema, run once
  in the cloud project's SQL editor.

For local testing:

```bash
npx supabase db reset     # rebuild local DB from scratch: applies all migrations
```

To change the schema:

```bash
npx supabase migration new add_some_table    # creates a timestamped file in supabase/migrations/
# write your SQL in the new file, then:
npx supabase db reset                        # verify it applies cleanly locally
```

Keep `backend/schema.sql` in sync with any migration you add, and follow the
existing pattern: enable RLS on every table with a public-read policy and a
service-role full-access policy (see `schema.sql` for examples).

## Installing and updating packages

Same rules as the frontend, but inside `backend/`:

```bash
cd backend
npm install <package>                     # runtime dependency
npm install -D @types/<package>          # most backend deps need a types package too
npm outdated && npm update                # update within semver ranges
```

After changes, confirm `npm run dev` boots and `npm run build` compiles
cleanly (TypeScript strict mode will catch type breakage), then commit
`package.json` + `package-lock.json` together.

## Deployment

The backend deploys to Vercel as its own project. `backend/vercel.json`
builds `src/index.ts` with `@vercel/node` and routes everything to it. Two
things make this work:

- `src/index.ts` ends with `export default app` so Vercel can wrap Express as
  a serverless function (the `app.listen()` call still works locally).
- All env vars from the table above are set in the Vercel project settings —
  with `FRONTEND_URL` pointing at the deployed frontend origin and the
  Supabase vars pointing at the cloud project.

Known constraint: Vercel caps request bodies at **4.5 MB**, which is why the
frontend compresses images to under 1 MB before uploading.
