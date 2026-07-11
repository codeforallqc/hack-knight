# Hack Knight Documentation

The Hack Knight website: a Vite + React frontend and an
Express + Supabase backend, both deployed on Vercel.

## Start here

| Doc | What it covers |
|---|---|
| [frontend-stack.md](frontend-stack.md) | React/Vite/Tailwind stack, running the dev server, env vars, installing & updating packages, conventions |
| [backend-stack.md](backend-stack.md) | Express/TypeScript/Supabase stack, env setup, **running Supabase locally**, migrations, deployment |
| [testing-and-github.md](testing-and-github.md) | How to verify changes before pushing, branch/commit/PR workflow, hard rules |

## Quick start (full local stack)

```bash
# 1. Local Supabase (needs Docker Desktop running)
npx supabase start                 # from repo root; note the printed URL + service_role key

# 2. Backend
cd backend
npm install
cp .env.example .env               # fill in values — see backend-stack.md
npm run dev                        # http://localhost:3000

# 3. Frontend (new terminal)
cd frontend
npm install
# create frontend/.env.local with this one line:
#   VITE_API_URL=http://localhost:3000/api
npm run dev                        # http://localhost:5173
```
