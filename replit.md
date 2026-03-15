# Denarixx OneEarth — AI Infrastructure Command Platform

## Overview

Premium MVP web platform serving as a unified AI infrastructure command center for Africa. Three modules: Denarixx Energy (solar microgrid monitoring), LifeMesh (person safety tracking + SOS), and EarthShield (disaster alerts). pnpm workspace monorepo using TypeScript.

## Key Features
- Dark luxury gold/black command-center UI
- Full multilingual support (EN, FR, SW, AR, PT) — auto-detects browser language via i18next
- AI-generated cinematic background: Africa-from-space hero image + looping city-night video on login
- Gold circuit board tech-grid texture on sidebar; Africa ambient on all content pages
- Real satellite image in dashboard operations map
- Live UTC clock, animated alert feed, sparkline stat cards
- **10 pages**: Login, Dashboard, Command Center, Energy Grid, LifeMesh, EarthShield Intel, Unified Alerts, Sites & Nodes, Personnel, Settings
- **Backend Auth** (`POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`): in-memory session store, signed cookie (`den_session`, 8h), SHA-256 password hashing, audit log on login/logout
- **Auth Context** (`src/context/auth.tsx`): calls backend first, falls back to localStorage; exports `can(permission)` for role-gated UI; logout calls backend then clears storage
- **RBAC Permissions**: `Permission` type with 8 actions mapped to roles. Admin gets all. Operator can run scenarios, drills, broadcast, deploy. Government can generate reports. Community has no actions.
- **Audit Log**: `audit_log` DB table (actor, actorRole, action, target, details, createdAt). Entries written on login, logout, alert status change, broadcast alert. `GET /api/audit/log` endpoint with limit param.
- **Dashboard Actions** (all functional): Emergency Drill modal → broadcasts drill alert to DB; Broadcast Alert modal → `POST /api/alerts/broadcast`; Generate Report → downloads JSON report; Deploy Node → routes to Sites page. All permission-gated (hidden/disabled for insufficient roles).
- **Activity Feed** on dashboard right column: live-pulls from `GET /api/audit/log` with emoji-coded actions per type.
- **EarthShield Geo Intelligence**: filter tabs by disaster type (All/Flood/Wildfire/Storm etc.), alerts grouped by severity (CRITICAL/WARNING/MONITORING bands), Spatial Risk Distribution panel with zone coordinates, Incident Timeline, Risk Legend.
- **Site Detail Modal**: enriched with real energy telemetry (solar/battery/grid), protected persons list (status + contact), active alerts linked by location match.
- **Command Center** (`/command-center`): 6 scenario simulation engine — readiness score, affected sites/persons, energy status, 6 recommended actions, escalation timeline per scenario.
- **Alert Routes**: ordered DESC, status filter, `PATCH /api/alerts/:id/status` (writes audit), `POST /api/alerts/broadcast` (writes audit).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
