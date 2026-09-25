# Frontend Stack

The frontend is a single-page React app for the Queens College Hack Knight
website, located in `frontend/`. It is written in TypeScript (TSX) with
strict mode enabled.

## Stack at a glance

| Layer | Technology | Notes |
|---|---|---|
| Build tool | [Vite 8](https://vite.dev) | Dev server + production bundler |
| Language | TypeScript 5 (strict) | `tsc -b` runs before every build; project references in `tsconfig.json` |
| UI framework | React 19 | With `StrictMode` enabled in `src/main.tsx` |
| Routing | React Router 7 (`react-router-dom`) | `BrowserRouter` set up in `src/App.tsx` |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) | Plus hand-written CSS in `src/styles/` |
| Animation | Motion 12 (`motion/react`) | Successor to Framer Motion; used for page transitions |
| Images | `browser-image-compression` | Resizes admin uploads to display size and re-encodes as WebP before sending |
| Markdown | `react-markdown` | Renders admin-written sponsor blurbs; skips raw HTML by default |
| Linting | ESLint 9 (flat config, `eslint.config.js`) | With `typescript-eslint`, `react-hooks`, and `react-refresh` plugins |

## Directory layout

```
frontend/
├── index.html              # Entry HTML. Google Fonts are loaded HERE and only here
├── vite.config.ts          # Vite + React + Tailwind plugins
├── eslint.config.js        # ESLint flat config
├── tsconfig.json           # Project references → tsconfig.app.json + tsconfig.node.json
├── vercel.json             # SPA rewrite: all routes → index.html; /photos/* proxied to Supabase storage
├── public/                 # Static files served as-is
└── src/
    ├── main.tsx            # ReactDOM entry point
    ├── App.tsx             # Router, page transitions, auth guard
    ├── types.ts            # Shared domain types (ScheduleEvent, Sponsor, TeamMember, ...)
    ├── vite-env.d.ts       # import.meta.env typing (VITE_API_URL, VITE_SUPABASE_*, VITE_TURNSTILE_SITE_KEY)
    ├── index.css           # Tailwind v4 entry: design tokens (@theme) + base layer
    ├── pages/              # Route-level components (Home, SchedulePage, RegisterPage, AdminPage, ...)
    ├── components/
    │   ├── site/           # Public site components (Navbar, Hero, CountdownTimer, TeamSection,
    │   │                   #   SponsorsCarousel + SponsorBlurb for sponsors,
    │   │                   #   SchoolCombobox + TurnstileWidget for the registration form, ...)
    │   └── admin/          # Admin dashboard
    │       ├── adminTypes.ts     # Draft shapes for staged edits (AdminEvent, AdminMember, ...)
    │       ├── ui.tsx            # Shared UI kit (Panel, SaveBar, DiffModal, DragGrid, ScaledPreview, ...)
    │       ├── icons.tsx         # Shared SVG icon set
    │       ├── useObjectUrls.ts  # Object-URL lifecycle for staged image previews
    │       ├── MiscTab.tsx       # Site settings tab (countdown target, MLH badge, registration open/closed, MLH pre-partnership disclaimer, sponsors TBA teaser, event location)
    │       ├── schedule/         # ScheduleTab + EventModal + scheduleMeta
    │       ├── gallery/          # GalleryTab + YearPanel
    │       ├── team/             # TeamTab + MemberModal + CompaniesPanel + memberUtils
    │       ├── sponsors/         # SponsorsTab + SponsorModal + TierPanel + sponsorUtils
    │       └── registrations/    # RegistrationsTab (search, pagination, CSV export, resume links, delete)
    ├── hooks/              # Data-fetching hooks (useSchedule, useGallery, useTeam, useSponsors,
    │                       #   useSiteSettings, useCountdown, useRegistrations) + useAuth.
    │                       #   Public hooks are built on useApiData (shared response cache)
    ├── data/               # Static fallback data used when the API is unreachable
    ├── lib/
    │   ├── api.ts          # Auth-aware fetch helper (token from the Supabase session) + compressImage
    │   ├── supabase.ts     # Browser Supabase client. Admin Google sign-in only, never data
    │   ├── location.ts     # Event location defaults + site_settings keys (shared by Hero + Misc tab)
    │   ├── mlh.ts          # MLH trust badge constants (shared by Navbar + admin preview)
    │   ├── registrationOptions.ts  # Age/level-of-study/country/demographic/major options (mirrors the backend's copy)
    │   ├── schools.ts      # MLH-verified school list (mirrors the backend's copy)
    │   └── schedulePacking.ts  # Overlap-packing layout math for ScheduleGrid
    ├── styles/             # components.css, admin.css
    └── assets/             # Brand SVGs, photos, logos
```

## How data flows

The frontend **never reads or writes data in Supabase directly**. The one
Supabase touchpoint is auth: `lib/supabase.ts` handles the admin's Google
sign-in and session. All data goes through the Express API (see
[backend-stack.md](backend-stack.md)):

- **Public pages** use the hooks in `src/hooks/` (`useSchedule`, `useGallery`,
  `useTeam`, `useSponsors`, `useSiteSettings`, `useCountdown`). Each hook
  fetches from the API and **falls back to the static data in `src/data/`**
  (or a sensible default for site settings) if the API is down or returns
  nothing. This means the site never renders empty, so keep the static data
  reasonably fresh. All of these sit on `useApiData`, which keeps an
  in-memory cache per API path for the session and dedupes concurrent
  requests, so navigating between pages renders instantly from cache
  (the register page in particular gates on `registration_open` without a
  loading gap). Cached responses older than 60 seconds are refreshed in the
  background after render.
- **Admin pages** use `src/lib/api.ts`, which reads the access token from the
  Supabase session (`useAuth` exposes the same session reactively) and attaches
  it to every request. Supabase refreshes the token in the background, so there
  is no fixed-expiry cliff. A 401 signs the session out so the auth guard in
  `App.tsx` bounces back to login; a 403 means "signed in but not on the
  backend's `ADMIN_EMAILS` allowlist" and shows a not-authorized screen instead.
- **The registration form** (`pages/RegisterPage.tsx`, at `/register`) POSTs
  JSON to the public `/api/registrations` endpoint. Besides the MLH-required
  fields it collects the demographic questions (gender, optional pronouns,
  race/ethnicity, sexual orientation, major), dietary restrictions, an
  optional LinkedIn URL, and a required Google Drive link to the applicant's
  resume (shared as "anyone with the link can view", so the CSV handed to
  MLH links straight to every file). It mirrors the backend's validation for
  fast feedback (options come from `lib/registrationOptions.ts` and
  `lib/schools.ts`), renders the Turnstile captcha when
  `VITE_TURNSTILE_SITE_KEY` is set, and only opens when the
  `registration_open` site setting is on. The backend re-checks all of it.
  While closed it shows "Applications Opening Soon", or "Applications Closed"
  when `registration_closed_mode` is `closed` (Admin → Misc → Applications).
  Admins open resumes straight from the Registrations tab; each row's Resume
  link opens the Drive file in a new tab.
- **Image uploads** go through `compressImage()` in `lib/api.ts` (target
  < 1 MB) so requests stay under Vercel's 4.5 MB body limit.

Backend rows are `snake_case`; the hooks map them to `camelCase` before
components see them (see `mapEvent` in `useSchedule.ts` for the pattern).

## Running locally

```bash
cd frontend
npm install          # first time, or after pulling changes to package.json
npm run dev          # dev server at http://localhost:5173 with hot reload
```

Other scripts:

```bash
npm run build        # production build → frontend/dist/
npm run preview      # serve the production build locally
npm run lint         # ESLint over the whole frontend
```

### Environment variables

Copy the template and fill it in (`frontend/.env.local` is git-ignored):

```bash
cd frontend
cp .env.example .env.local
```

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the Express API, **including the `/api` prefix**, e.g. `http://localhost:3000/api` |
| `VITE_SUPABASE_URL` | Supabase project URL (local stack: `http://127.0.0.1:54321`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable (anon) key. Safe in the browser; used only for admin Google sign-in |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (public). The registration form only renders the captcha when set; use Cloudflare's always-passing test key `1x00000000000000000000AA` for local dev |

Rules to know:

- Vite only exposes variables prefixed with `VITE_` to the browser. Anything
  in a frontend env file is **public**, so never put secrets here. The Supabase
  **secret** key and the Turnstile **secret** key belong in `backend/.env` only.
- Access them via `import.meta.env.VITE_API_URL` (not `process.env`), and add
  new ones to the typing in `src/vite-env.d.ts`.
- **Restart the dev server** after changing env files; they are read at startup.
- If `VITE_API_URL` is unset, `lib/api.ts` and the hooks fall back to
  same-origin paths, which only works when the API is served from the same
  domain (production behind rewrites). For local dev you want it set.

## Installing and updating packages

Always run npm commands **inside `frontend/`**. The frontend and backend have
separate `package.json` files.

```bash
cd frontend
npm install <package>            # add a runtime dependency
npm install -D <package>         # add a dev-only dependency (build/lint tooling)
npm outdated                     # see what has newer versions
npm update                       # update within the semver ranges in package.json
npm install <package>@latest     # deliberate major-version bump
```

After any dependency change:

1. Verify `npm run dev`, `npm run build`, and `npm run lint` still pass.
2. Commit `package.json` **and** `package-lock.json` together
   (`chore(frontend): ...`). Never hand-edit the lockfile.
3. When pulling someone else's dependency changes, run `npm install` (or
   `npm ci` for an exact clean install from the lockfile).

## Conventions

- **Fonts:** loaded once via the Google Fonts `<link>` in `index.html`
  (Space Grotesk, Lexend, JetBrains Mono). Do not re-import fonts in
  component files or CSS.
- **Design tokens:** colors like `void`, `surface`, `ultraviolet`, and the
  sponsor tier colors are defined in the `@theme` block of `src/index.css`.
  Use the tokens, not raw hex values. See [MASTER.md](MASTER.md) for the
  design system (including the admin layer).
- **Component halves:** public site components live in `components/site/`,
  admin components in `components/admin/`. Each large admin tab is a folder
  (tab + its modals/panels/utils); shared admin pieces live at the `admin/`
  root (`ui.tsx`, `icons.tsx`, `useObjectUrls.ts`, `adminTypes.ts`).
- **Admin routes** (`/admin/*`) render standalone without the public
  Navbar/Footer; `App.tsx` checks `location.pathname.startsWith("/admin")`.
- New pages get a `<Route>` in `App.tsx` wrapped in `PageTransition`.

## Deployment

The frontend deploys to Vercel as its own project (separate from the backend).
`frontend/vercel.json` rewrites every path to `index.html` so React Router can
handle client-side routes. It also rewrites `/photos/*` to the production
Supabase storage bucket with rewrite caching enabled: `useApiData` swaps the
storage host for `/photos/` in every API response, so visitors fetch images
from Vercel's CDN and Supabase serves each object roughly once per region
instead of once per visitor (its free-plan egress was running out). The
destination is the production project URL, hardcoded because `vercel.json`
cannot read env vars; `vite.config.ts` proxies the same path in dev. Set all four env vars from the table above in the
Vercel project settings: `VITE_API_URL` pointing at the deployed backend
(again, including `/api`), the cloud Supabase URL + anon key, and the real
(non-test) Turnstile site key.
