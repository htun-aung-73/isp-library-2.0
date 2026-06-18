# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ISP Library Management System — a full-stack Next.js 16 (App Router, React 19) library catalog with borrowing, analytics, author directory, and an admin dashboard. Package manager is **pnpm**.

> **Note:** This project was migrated from a Baserow backend to **Prisma + PostgreSQL** (hence the folder name `isp-library-2.0`). `SPEC.md` is the detailed architecture reference; `README.md` covers setup. Auth token lifetimes are **15m access / 7d refresh** (`lib/db/auth-tokens.ts`).

## Commands

```bash
pnpm dev              # Next dev server (localhost:3000)
pnpm build            # Runs `prisma generate` THEN `next build`
pnpm start            # Production server
pnpm lint             # eslint . (next/core-web-vitals)
pnpm lint:fix         # eslint --fix

pnpm db:generate      # prisma generate -> writes lib/generated/prisma (gitignored)
pnpm db:migrate       # prisma migrate dev
pnpm db:deploy        # prisma migrate deploy (prod)
pnpm db:seed          # seed from prisma/data/*.csv via prisma/seed.ts
pnpm db:admin-seed    # tsx prisma/admin-seed.ts (creates admin user)
pnpm db:reset         # migrate reset --force + reseed
```

There is **no test runner** configured in this project.

### Critical setup gotcha
The Prisma client is generated to `lib/generated/prisma/` which is **gitignored**. After a fresh clone or schema change you **must** run `pnpm db:generate` (or `pnpm build`, which does it) before the app will run — imports from `lib/generated/prisma/client` will otherwise fail.

## Architecture

### Request/data flow
```
React component → Redux store → RTK Query (libraryApi) → /api/* route handler → lib/db DAL → Prisma → PostgreSQL
```
- **Client state**: Redux Toolkit. `lib/redux/store.ts`, slices in `lib/redux/slices/` (`authSlice`, `uiSlice`), data fetching via RTK Query in `lib/redux/services/libraryApi.ts`. Hydrated server-side via `getSession()` in `app/layout.tsx` → `lib/redux/provider.tsx`.
- **API layer**: route handlers under `app/api/**`. They call the **Data Access Layer** in `lib/db/client.ts`, which is the single place that runs Prisma queries and maps DB rows to frontend types (`lib/db/types.ts`). Prefer adding DB logic to the DAL, not inline in routes.
- **DB client**: always import the singleton `prisma` from `lib/prisma.ts`. It wraps `PrismaClient` with the `@prisma/adapter-pg` Pool adapter and reuses the pool across hot reloads. Connection comes from `DATABASE_URL` (the `schema.prisma` datasource has no inline `url`).

### `proxy.ts` is the middleware
Next.js 16 renamed `middleware.ts` to **`proxy.ts`** (exports `proxy()` + `config.matcher`). This file is the edge gate for the whole app — edit it for route/API protection. It:
- Reads the **access token** from the `Authorization: Bearer` header and the **refresh token** from an httpOnly cookie, building an `effectiveUser` for page-level auth.
- Protects pages (`/books`, `/my-books`, `/analytics`, `/authors`), admin pages (`/admin/*`), and API routes (401 if no valid access token; 403 for non-admins on `/api/users`).
- `publicApiPaths` in this file is the allowlist of unauthenticated endpoints — add new public auth routes there.

### Authentication
Custom dual-JWT auth (no NextAuth). Core logic in `lib/db/auth.ts` (login/signup/refresh/logout, cookie handling, password reset, account confirmation) and `lib/db/auth-tokens.ts` (`jose`-based sign/verify; `ACCESS_TOKEN_EXPIRY=15m`, `REFRESH_TOKEN_EXPIRY=7d`, plus a reset token).
- Access token lives in the Redux store (memory); refresh token is an httpOnly cookie **and** the `refresh_token` column on `users`.
- On a `401`, RTK Query's `baseQueryWithReauth` (in `libraryApi.ts`) silently calls `/api/auth/refresh` and **deduplicates concurrent refreshes** via a module-level promise. Preserve that dedupe if editing.
- Email flows (verification + password reset) go through `lib/email.ts` using **Mailchimp Transactional** (`MAILCHIMP_API_KEY`). `is_verified` on `User` gates account confirmation.

### Data model (`prisma/schema.prisma`)
Five models — `User`, `Author`, `Publisher`, `Book`, `BorrowedBook` — with a `BorrowStatus` enum (`borrowed | returned | overdue`). **Dual-ID pattern**: every model has an internal `id` (PK, used for relations) and a public-facing `*_id` UUID. Relations join on internal `id`; the DAL exposes the public `*_id` to the frontend. Tables are snake_case via `@@map`.

### UI
shadcn/ui (new-york style) in `components/ui/`, feature components flat in `components/`. Tailwind CSS v4 (config in `app/globals.css`, not a JS file). AG Grid (Community v35) for catalog tables, Recharts for analytics. Path alias `@/*` maps to the repo root.

### Build note
`next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized: true` — **type errors will NOT fail the build**, so rely on the editor / `tsc` for type checking rather than `pnpm build`.
