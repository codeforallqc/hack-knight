# Testing Habits & GitHub Practices

How we verify changes and how code gets from your machine into
`codeforallqc/hack-knight:main`.

## Testing

There is currently **no automated test framework** in this repo. Verification
is manual and deliberate — which makes discipline matter more, not less. The
habit that replaces a CI suite is: **never claim something works without
having run it and seen the output.**

### The minimum bar for any change

Before you push, all of these must pass:

```bash
# Frontend changes
cd frontend
npm run lint          # no ESLint errors
npm run build         # production build succeeds

# Backend changes
cd backend
npm run build         # TypeScript compiles with no errors (strict mode)
npm run dev           # server boots without env/startup errors
```

A TypeScript compile in strict mode is the backend's first line of defense —
treat a failing `npm run build` as a failing test.

### Testing backend changes

1. Start local Supabase and the backend (see
   [backend-stack.md](backend-stack.md#supabase-for-local-testing)).
2. Hit the health check: `curl http://localhost:3000/api/health`.
3. Exercise **every endpoint you touched**, not just the happy path:

   ```bash
   # Public read
   curl http://localhost:3000/api/schedule

   # Login → capture the token
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"password":"your-local-password"}'

   # Authenticated write
   curl -X POST http://localhost:3000/api/schedule \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"day":"fri","start_hour":18,"end_hour":19,"label":"Test event"}'

   # And the failure cases: no token → expect 401; bad body → expect 400
   ```

4. For schema changes, run `npx supabase db reset` and confirm migrations
   apply cleanly to an empty database — that's the closest thing we have to a
   reproducible integration test.
5. Check the data landed correctly in Studio (`http://127.0.0.1:54323`).

### Testing frontend changes

1. Run the backend + local Supabase, then `npm run dev` in `frontend/` with
   `VITE_API_URL` set.
2. Click through the surfaces you changed in the browser, watching the
   console and network tab for errors.
3. Test the **fallback path** too: stop the backend and confirm public pages
   still render from the static data in `src/data/`.
4. For admin changes: log in, do the full create → edit → delete cycle, and
   confirm a 401 (expired/cleared token) bounces you to the login page.
5. For uploads: use a large image and confirm compression keeps the request
   under Vercel's 4.5 MB limit.

### Habits worth keeping

- **Test at the boundary you changed.** A route change gets curl; a hook
  change gets a browser check; a schema change gets `db reset`.
- **Reset state before verifying.** `npx supabase db reset` gives you a clean
  database so you're not testing against leftovers from a previous session.
- **Verify error paths, not just success.** Missing auth, bad input, and
  empty responses are where regressions hide.
- **Final check is a Vercel preview deploy.** Every PR gets a preview URL —
  click through it before merging; local success doesn't guarantee the
  serverless build behaves identically.
- **If you add a test framework later**, the natural fits are Vitest for the
  frontend (shares Vite's config) and Vitest + Supertest for the Express
  routes. Add it in its own PR.

## GitHub practices

### Repo model: fork + upstream

Development happens on personal forks; the org repo is the source of truth.

- `upstream` → `codeforallqc/hack-knight` (org repo, where PRs merge)
- `origin` → your personal fork (e.g. `ajiangny/hack-knight`)

**Nothing is committed to `main` directly** — not on the org repo, not on
your fork. `main` only moves by syncing from upstream.

### Branch workflow

```bash
# 1. Sync your main with the org repo
git fetch upstream
git checkout main
git merge --ff-only upstream/main
git push origin main

# 2. Branch off fresh main
git checkout -b feat/<short-name>

# 3. Work in small, logical commits (see message format below)

# 4. Push to your fork and open a PR
git push -u origin feat/<short-name>
# PR: yourfork:feat/<short-name> → codeforallqc:main

# 5. After merge: sync main again, delete the branch, start the next one
git branch -d feat/<short-name>
git push origin --delete feat/<short-name>
```

### Branch naming

`<type>/<short-kebab-name>` — matching the commit types below:

- `feat/gallery-api`, `feat/supabase-foundation`
- `fix/schedule-timezone`
- `chore/dependency-bumps`

### Commit messages: Conventional Commits

Format: `type(scope): imperative description` — scope is optional but
preferred. Real examples from this repo's history:

```
feat(admin): add login page
feat(hooks): add API data-fetching hooks
fix(backend): change nodemon watch to tsx watch for compatibility
refactor(frontend): fetch schedule/gallery/team from API
chore(backend): replace better-sqlite3 with @supabase/supabase-js
```

Types in use: `feat`, `fix`, `refactor`, `chore`, `docs`. Common scopes:
`frontend`, `backend`, `admin`, `hooks`.

Keep commits **small and logical** — one coherent change per commit, so a
reviewer can read the history as a story and a bad change can be reverted
cleanly. A dependency swap, its code changes, and an unrelated UI tweak are
three commits, not one.

### Pull requests

- **One concern per PR.** The Supabase migration shipped as five separate
  PRs (foundation → gallery API → team API → frontend hooks → admin UI), each
  independently reviewable and safe to merge alone. Follow that pattern:
  if a PR breaks the site when merged by itself, it's scoped wrong.
- In the description say **what** changed, **why**, and **how you verified
  it** (the commands you ran, what you clicked through).
- Check the Vercel preview deploy before asking for review.
- Address review feedback with new commits (don't rewrite pushed history
  mid-review).

### Hard rules

- No direct commits to `main`.
- No force-pushing shared branches (anything someone else may have pulled).
- Never commit secrets: `backend/.env` is git-ignored — keep it that way.
  If a secret ever lands in a commit, rotate it; deleting the commit is not
  enough.
- Commit `package-lock.json` together with `package.json`, and never
  hand-edit the lockfile.
