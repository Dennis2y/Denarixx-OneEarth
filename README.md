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
