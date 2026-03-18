# Denarixx OneEarth

Denarixx OneEarth is a premium AI-driven global resilience and command platform for monitoring energy, alerts, protected persons, disaster intelligence, sites, and operations.

## Current status
Working restored MVP/demo with seeded backend data and premium restored UI.

## Stack
- React
- Vite
- TypeScript
- Express
- Drizzle
- PostgreSQL
- pnpm workspace

## Local run
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter ./scripts exec tsx src/seed.ts
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/denarixx run dev

## Production URLs

- Frontend: https://denarixx-oneearth-web.onrender.com
- Backend: https://denarixx-oneearth-api.onrender.com

## Release

- Current release tag: v1.0.0

## AI Console

Denarixx OneEarth v1 uses a premium simulation/orchestration workflow for operator actions.
It does not require an external AI API key for the current production version.

## Live Realtime

- Server-Sent Events endpoint is active
- Live command stream is working in production

## Known Non-Blocking Warning

A Three.js deprecation warning may appear from the globe dependency stack (`THREE.Clock` → `THREE.Timer` migration). This does not block current production functionality.
