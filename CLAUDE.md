# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm run db:seed      # Seed database with demo data

npm run use:local    # Switch to SQLite + disable auth (quick local dev)
npm run use:prod     # Switch back to PostgreSQL + re-enable auth
```

**Local dev setup:** Run `npm run use:local` once — it switches the Prisma schema to SQLite, writes `.env.local` with `DISABLE_AUTH=true`, and seeds demo data. No database server needed.

Demo credentials (after seeding): `admin@hotel.com` / `Admin@123`

## Architecture

**Stack:** Next.js 15 App Router, TypeScript, Prisma ORM, NextAuth v5, Tailwind CSS + Radix UI

### Route Structure

- `src/app/(auth)/` — login/register pages (public)
- `src/app/(dashboard)/` — all protected dashboard pages; `layout.tsx` handles auth redirect
- `src/app/api/` — REST API routes
- `src/app/api/ical/[roomId]/` — public iCal feed endpoint (no auth required)
- `src/app/api/webhooks/` — public OTA webhook endpoints (no auth required)

### Auth

NextAuth v5 with JWT strategy and Credentials provider (bcryptjs passwords). When `DATABASE_URL` starts with `file:` (SQLite local mode) or `DISABLE_AUTH=true`, auth is entirely bypassed and a hardcoded admin session is returned. All dashboard API routes call `await auth()` at the top and return 401 if no session.

### Database

Dual-schema setup for local vs. production:
- `prisma/schema.sqlite.prisma` → used locally (copied to `schema.prisma` by `use:local`)
- `prisma/schema.postgres.prisma` → used in production (copied by `use:prod`)
- `scripts/use-local.js` and `scripts/use-prod.js` handle the swap

Prisma client is a singleton in `src/lib/db.ts` to prevent hot-reload issues.

**Key data model:**
- `Property` → `Room` (with `RoomType`, `RatePlan`, `Availability`)
- `Booking` → `Guest` (1:1, cascades), `Room`, `Channel`
- `Channel` → `SyncLog` (audit trail)
- JSON string columns: `RoomType.amenities`, `RatePlan.daysOfWeek` (not native arrays)
- `Decimal` type for all currency amounts

### Service Layer (`src/lib/`)

- `BookingService` — booking CRUD with Prisma transactions to prevent double-booking; blocks/unblocks `Availability` rows atomically
- `SyncService` — orchestrates OTA sync; iCal fully implemented, API-based channels stubbed
- `ICalService` — parses inbound iCal feeds (`node-ical`) and generates outbound feeds (`ical-generator`)
- `DashboardService` — aggregated KPI queries

### API Route Conventions

All routes follow: `auth check` → `Zod validation` → `service call` → `{ error }` response on failure. Status codes: 201 (created), 400 (validation), 401 (unauthenticated), 409 (conflict), 500 (server error).

### Channel Integration

Eight channel types: `AIRBNB`, `BOOKING_COM`, `GOIBIBO`, `MAKEMYTRIP`, `AGODA`, `EXPEDIA`, `ICAL`, `DIRECT`. iCal sync is fully functional. API-based OTA channels have credential storage and route structure in place but full integration is pending partner registration.

## Environment Variables

**Required for production:**
```
DATABASE_URL       # PostgreSQL connection string
AUTH_SECRET        # 32+ char random string for JWT signing
NEXTAUTH_URL       # App URL (e.g. https://yourdomain.com)
```

**Optional OTA credentials** (for API-based channel sync):
```
AIRBNB_WEBHOOK_SECRET
BOOKING_COM_API_KEY / BOOKING_COM_PROPERTY_ID
GOIBIBO_API_KEY / MAKEMYTRIP_API_KEY / AGODA_API_KEY
EXPEDIA_API_KEY / EXPEDIA_PROPERTY_ID
REDIS_URL          # For sync job queuing
```
