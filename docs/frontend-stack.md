# Frontend Stack

The frontend is a single-page React app for the Queens College Hack Knight
website, located in `frontend/`. It is plain JavaScript (JSX) — no TypeScript
on this side of the project.

## Stack at a glance

| Layer | Technology | Notes |
|---|---|---|
| Build tool | [Vite 8](https://vite.dev) | Dev server + production bundler |
| UI framework | React 19 | With `StrictMode` enabled in `src/main.jsx` |
| Routing | React Router 7 (`react-router-dom`) | `BrowserRouter` set up in `src/App.jsx` |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) | Plus hand-written CSS in `src/styles/` |
| Animation | Motion 12 (`motion/react`) | Successor to Framer Motion; used for page transitions |
| Images | `browser-image-compression` | Compresses admin uploads client-side before sending |
| Linting | ESLint 9 (flat config, `eslint.config.js`) | With `react-hooks` and `react-refresh` plugins |

## Directory layout

```
frontend/
├── index.html              # Entry HTML — Google Fonts are loaded HERE and only here
├── vite.config.js          # Vite + React + Tailwind plugins
├── eslint.config.js        # ESLint flat config
├── vercel.json             # SPA rewrite: all routes → index.html
├── public/                 # Static files served as-is
└── src/
    ├── main.jsx            # ReactDOM entry point
    ├── App.jsx             # Router, page transitions, auth guard
    ├── index.css           # Tailwind v4 entry + base layer
    ├── pages/              # Route-level components (Home, SchedulePage, AdminPage, ...)
    ├── components/
    │   ├── site/           # Public site components (Navbar, Hero, CountdownTimer, TeamSection, ...)
    │   └── admin/          # Admin dashboard
    │       ├── ui.jsx            # Shared UI kit (Panel, SaveBar, DiffModal, DragGrid, ScaledPreview, ...)
    │       ├── icons.jsx         # Shared SVG icon set
    │       ├── useObjectUrls.js  # Object-URL lifecycle for staged image previews
    │       ├── MiscTab.jsx       # Site settings tab (countdown target, MLH badge)
    │       ├── schedule/         # ScheduleTab + EventModal + scheduleMeta
    │       ├── gallery/          # GalleryTab + YearPanel
    │       ├── team/             # TeamTab + MemberModal + CompaniesPanel + memberUtils
    │       └── sponsors/         # SponsorsTab + SponsorModal + TierPanel + OtherCompaniesPanel + sponsorUtils
    ├── hooks/              # Data-fetching hooks (useSchedule, useGallery, useTeam,
    │                       #   useSponsors, useSiteSettings, useCountdown)
    ├── data/               # Static fallback data used when the API is unreachable
    ├── lib/
    │   ├── api.js          # Auth-aware fetch helper (JWT from localStorage) + compressImage
    │   ├── mlh.js          # MLH trust badge constants (shared by Navbar + admin preview)
    │   └── schedulePacking.js  # Overlap-packing layout math for ScheduleGrid
    ├── styles/             # components.css, admin.css
    └── assets/             # Brand SVGs, photos, logos
```

## How data flows

The frontend **never talks to Supabase directly**. All data goes through the
Express API (see [backend-stack.md](backend-stack.md)):

- **Public pages** use the hooks in `src/hooks/` (`useSchedule`, `useGallery`,
  `useTeam`, `useSponsors`, `useSiteSettings`, `useCountdown`). Each hook
  fetches from the API and **falls back to the static data in `src/data/`**
  (or a sensible default for site settings) if the API is down or returns
  nothing. This means the site never renders empty — keep the static data
  reasonably fresh.
- **Admin pages** use `src/lib/api.js`, which attaches the JWT stored in
  `localStorage` (key `admin_token`) to every request, throws on non-2xx, and
  clears the token on 401 so `RequireAuth` in `App.jsx` bounces back to login.
- **Image uploads** go through `compressImage()` in `lib/api.js` (target
  < 1 MB) so requests stay under Vercel's 4.5 MB body limit.

Backend rows are `snake_case`; the hooks map them to `camelCase` before
components see them (see `mapEvent` in `useSchedule.js` for the pattern).

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

The frontend reads exactly one variable: `VITE_API_URL` — the base URL of the
Express API **including the `/api` prefix**. Create `frontend/.env.local`
(git-ignored) for local development:

```
VITE_API_URL=http://localhost:3000/api
```

Rules to know:

- Vite only exposes variables prefixed with `VITE_` to the browser. Anything
  in a frontend env file is **public** — never put secrets here.
- Access them via `import.meta.env.VITE_API_URL` (not `process.env`).
- **Restart the dev server** after changing env files; they are read at startup.
- If `VITE_API_URL` is unset, `lib/api.js` and the hooks fall back to
  same-origin paths, which only works when the API is served from the same
  domain (production behind rewrites). For local dev you want it set.

## Installing and updating packages

Always run npm commands **inside `frontend/`** — the frontend and backend have
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
  sponsor tier colors are defined in the Tailwind setup — use the tokens, not
  raw hex values. See `frontend/SETUP_CHANGELOG.md` for the full token table
  and [MASTER.md](MASTER.md) for the design system (including the admin layer).
- **Component halves:** public site components live in `components/site/`,
  admin components in `components/admin/`. Each large admin tab is a folder
  (tab + its modals/panels/utils); shared admin pieces live at the `admin/`
  root (`ui.jsx`, `icons.jsx`, `useObjectUrls.js`).
- **Admin routes** (`/admin/*`) render standalone without the public
  Navbar/Footer — `App.jsx` checks `location.pathname.startsWith("/admin")`.
- New pages get a `<Route>` in `App.jsx` wrapped in `PageTransition`.

## Deployment

The frontend deploys to Vercel as its own project (separate from the backend).
`frontend/vercel.json` rewrites every path to `index.html` so React Router can
handle client-side routes. Set `VITE_API_URL` in the Vercel project settings
to point at the deployed backend (again, including `/api`).
