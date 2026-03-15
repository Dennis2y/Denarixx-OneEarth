# Denarixx OneEarth — AI Infrastructure Command Platform

## Overview

Premium MVP web platform serving as a unified AI infrastructure command center for Africa. Three modules: Denarixx Energy (solar microgrid monitoring), LifeMesh (person safety tracking + SOS), and EarthShield (disaster alerts). pnpm workspace monorepo using TypeScript.

## Key Features
- Dark luxury gold/black command-center UI
- Full multilingual support (18 languages including EN, FR, AR, SW, PT, AM, ZH, HI, etc.) — auto-detects browser language via i18next
- AI-generated cinematic background: Africa-from-space hero image + looping city-night video on login
- Gold circuit board tech-grid texture on sidebar; Africa ambient on all content pages
- Real satellite image in dashboard operations map
- Live UTC clock, animated alert feed, sparkline stat cards
- **12 pages**: Landing (/), Login (/login), Dashboard, Command Center, Energy Grid, LifeMesh, EarthShield Intel, Unified Alerts, Sites & Nodes, Site Detail (/sites/:id), Personnel, Settings

### Public Landing Page (/)
- Premium hero with Africa-from-space background + cinematic video
- Module badges (Energy, LifeMesh, EarthShield) with pulsing indicators
- Animated headline: "Resilience Infrastructure for Africa."
- Impact metrics section with CountUp animation: Sites (248), Protected People (184,700+), Regions (31), Active Alerts (17)
- Platform Resilience Score bar (87/100)
- Three module cards: Denarixx Energy, LifeMesh, EarthShield — each with feature lists
- Command Center preview section with simulated UI mockup card
- Who It's For section: Governments, NGOs, Communities, Operators, Critical Facilities, Investors
- Trust strip: Security, 18 Languages, Institutional Grade, Always-On Monitoring
- CTA section with Demo and Request Access buttons
- Full footer with logo, tagline, version info
- Fixed navbar with anchor nav and Demo Login CTA
- Scroll-to-section anchors: #modules, #metrics, #audience, #command-center

### Improved Login Page (/login)
- Role card selector view (shown first): 4 demo accounts displayed as selectable cards
  - Cmdr. Prime (admin) — full access, Denarixx HQ
  - Adaeze Okafor (operator) — Lagos Field Ops
  - Kofi Mensah (government) — Ghana NADMO
  - Fatuma Wanjiru (community) — Kibera Community
- Each card shows: name, role badge (color-coded), organization, 2 capability tags + count
- Clicking a card pre-fills email/password and shows the form view with capability checklist
- "Switch" button goes back to card selector; "Use custom credentials" skips to bare form
- Back arrow to return to landing page
- "Demonstration Environment" notice shown prominently

### Dashboard Additions
- **System Status Banner**: top of page showing Operational/Warning status, live metrics (Sites, Alerts, Protected, Energy, Regions), animated live indicator
- **Module Health Summary**: Energy/LifeMesh/EarthShield mini health cards with status badge (operational/warning/critical), uptime progress bar, live metric detail
- **Recent Simulations Panel**: last 4 command center scenario runs with operator attribution, readiness score bar, affected sites/persons, severity, relative timestamp — links to Command Center

### Auth & Security
- **Backend Auth** (`POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`): in-memory session store, signed cookie (`den_session`, 8h), SHA-256 password hashing, audit log on login/logout
- **Global route protection**: `requireAuth` middleware applied to all routes in `routes/index.ts` — public only: health + auth endpoints. All others require a valid session.
- **Auth Context** (`src/context/auth.tsx`): calls backend first, falls back to localStorage; exports `can(permission)` for role-gated UI; logout calls backend then clears storage
- **RBAC**: `requireRole('admin','operator')` on sites POST/PATCH and users POST/PATCH; `requireRole('admin','operator','government')` on users GET. Community role blocked from admin functions with 403.
- `Permission` type with 8 actions mapped to roles: admin gets all, operator can run scenarios/drills/broadcast/deploy, government can generate reports, community has no actions.

### Audit Log & Activity Feed
- **Audit Log**: `audit_log` DB table (actor, actorRole, action, target, details, createdAt). Entries written on: login, logout, alert status change, alert broadcast, scenario run, site create, site update, user status change, report generation.
- **Activity Feed** on dashboard right column: live-pulls from `GET /api/audit/log` with emoji-coded action types.

### Site Detail Pages (/sites/:id)
- Full page with: energy history area chart (24 points, Battery/Solar/Load), real-time energy KPIs (battery/solar/load/grid), risk summary with computed score, protected persons list (status icons + emergency contacts), active alerts for the site, emergency contacts grid, site coordinates & metadata.
- "View Full Profile" (ExternalLink icon) added to site cards and table rows to navigate to detail page.
- Report download button calls `POST /api/reports/site/:id` and saves JSON to disk.

### Command Center History
- **Simulation History**: `simulation_history` DB table stores every run with: scenarioId, scenarioType, scenarioLabel, operator email/name/role, readinessScore, riskSeverity, affectedSitesCount, affectedPersonsCount, estimatedPopulationAtRisk, full resultJson.
- **History Panel**: toggled with "History" button in page header. Shows past simulations with operator attribution (name + role badge + email), readiness score, affected counts, relative timestamp. "Load" button restores any past result instantly.
- **Operator Attribution**: simulation result banner shows operator name + role badge for every run.
- **Report Export**: downloads `POST /api/reports/scenario/:historyId` as structured JSON file.

### Report Generation
- `POST /api/reports/site/:id` — site resilience report (energy summary, persons by status/category, alert counts, metadata)
- `POST /api/reports/scenario/:historyId` — scenario simulation report (full result + simulation metadata)
- `POST /api/reports/alerts` — platform-wide alerts summary (counts by severity, status, module, type)
- All reports include generatedBy operator attribution and are downloadable as JSON.

### Dashboard Quick Actions (all functional)
- Emergency Drill modal → broadcasts drill alert to DB
- Broadcast Alert modal → `POST /api/alerts/broadcast`
- Generate Report → downloads JSON report of current stats + recent alerts + audit log
- Deploy Node → routes to Sites page
- All permission-gated (disabled/hidden for insufficient roles)

### EarthShield Geo Intelligence
- Disaster alerts table with type, severity, affected population, region, country, coordinates
- Risk zones table with preparedness scores and coordinates
- Filter tabs by disaster type; severity band grouping (CRITICAL/WARNING/MONITORING)
- Spatial Risk Distribution panel; Incident Timeline; Risk Legend

### Alert Routes
- ordered DESC, status filter, `PATCH /api/alerts/:id/status` (writes audit), `POST /api/alerts/broadcast` (writes audit)

### Users Management (RBAC-gated)
- `GET /api/users` — requires admin/operator/government
- `PATCH /api/users/:id/status` — requires admin (activates/suspends, writes audit)
- `POST /api/users` — requires admin (creates user, writes audit)

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
