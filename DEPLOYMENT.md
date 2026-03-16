# Denarixx OneEarth Deployment Guide

## Overview

Denarixx OneEarth can be run in two ways:

1. Native local development
2. Dockerized local deployment

This guide covers both.

---

## Project Structure

artifacts/api-server → Express backend  
artifacts/denarixx → Vite frontend  
lib/db → database package  
scripts → seed scripts  

---

## Required Environment Variables

### Backend
DATABASE_URL  
PORT  
NODE_ENV  

### Frontend
BASE_PATH  
VITE_PORT  
VITE_API_URL  
NODE_ENV  

---

## Example Local .env

DATABASE_URL=postgresql://dennischarles@localhost:5432/denarixx_oneearth  
PORT=3001  
BASE_PATH=/  
NODE_ENV=development  
VITE_PORT=3002  
VITE_API_URL=http://localhost:3001  

---

## Example Production Env

See `.env.production.example`

Example:

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/denarixx_oneearth  
PORT=3001  
BASE_PATH=/  
NODE_ENV=production  
VITE_PORT=3002  
VITE_API_URL=https://your-api-domain.com  

---

# Native Local Development

## 1 Install dependencies

pnpm install

## 2 Export environment variables

export $(grep -v '^#' .env | xargs)

## 3 Push database schema

pnpm --filter @workspace/db run push

## 4 Seed database

pnpm --filter ./scripts exec tsx src/seed.ts

## 5 Start backend

pnpm --filter @workspace/api-server run dev

## 6 Start frontend

Open another terminal and run:

export $(grep -v '^#' .env | xargs)

pnpm --filter @workspace/denarixx run dev

---

# Native Local URLs

Backend health  
http://localhost:3001/api/health  

Frontend  
http://localhost:3002  

---

# Dockerized Local Deployment

## 1 Start Docker Desktop

On macOS:

open -a Docker

## 2 Build and run containers

docker compose up --build

## 3 Push schema to Docker database

Open another terminal:

export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/denarixx_oneearth

pnpm --filter @workspace/db run push

## 4 Seed Docker database

export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/denarixx_oneearth

pnpm --filter ./scripts exec tsx src/seed.ts

---

# Docker URLs

Backend health  
http://localhost:3003/api/health  

Frontend  
http://localhost:3004  

---

# Docker Database Access (Host Machine)

Host  
localhost  

Port  
5433  

Database  
denarixx_oneearth  

User  
postgres  

Password  
postgres  

---

# Health Check Endpoint

GET /api/health

Example:

curl http://localhost:3003/api/health

Expected response:

status: ok  
db: connected  
timestamp: current server time  

---

# Useful Commands

## Stop native dev processes

pkill -f "tsx ./src/index.ts" || true  
pkill -f "vite --config vite.config.ts" || true  
pkill -f "vite preview" || true  

## Stop Docker stack

docker compose down

## Rebuild Docker stack

docker compose up --build

## Check open ports

lsof -nP -iTCP:3001 -sTCP:LISTEN  
lsof -nP -iTCP:3002 -sTCP:LISTEN  
lsof -nP -iTCP:3003 -sTCP:LISTEN  
lsof -nP -iTCP:3004 -sTCP:LISTEN  
lsof -nP -iTCP:5432 -sTCP:LISTEN  
lsof -nP -iTCP:5433 -sTCP:LISTEN  

---

# Troubleshooting

## Docker page opens but dashboard is empty

Make sure you are using Docker ports:

Frontend  
http://localhost:3004

API  
http://localhost:3003/api/health

Do not use the native dev ports unless you started native services separately.

## Port 3001 already in use

pkill -f "tsx ./src/index.ts" || true

## Port 3002 already in use

pkill -f "vite --config vite.config.ts" || true  
pkill -f "vite preview" || true

## Port 5432 already in use

Use Docker database on port 5433 and seed using:

export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/denarixx_oneearth

## Docker daemon not running

open -a Docker

## Database not seeded

pnpm --filter @workspace/db run push  
pnpm --filter ./scripts exec tsx src/seed.ts  

---

# Current Deployment Status

Working:

Native local development  
Dockerized local deployment  
Health endpoint  
Backend environment validation  
Seeded demo dataset  
Frontend production build  
Route-based lazy loading  
Production API build and start mode  
CI passing on main  
Stable release tag: v0.1.0-stable  

---

# Next Production Steps

Deploy Postgres, API, and frontend to Render or Railway  
Add hosted production environment variables  
Attach custom domain  
Add monitoring and uptime checks  
Add smoke tests / end-to-end tests  
Add production screenshots and demo documentation  
