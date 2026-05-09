# Hotel Channel Manager

A production-grade hotel room availability management portal with OTA (Online Travel Agency) channel sync — supports Airbnb, Booking.com, Goibibo, MakeMyTrip, Agoda, and Expedia.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | PostgreSQL + Prisma v7 |
| Auth | NextAuth v5 (JWT) |
| UI | Tailwind CSS + Radix UI + Recharts |
| Validation | Zod v4 |
| iCal Sync | ical-generator + node-ical |

---

## Quick Start

### 1. Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted)

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/hotel_channel_manager"
AUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Generate AUTH_SECRET (PowerShell)

```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 4. Run Database Migration

```bash
npx prisma migrate dev --name init
```

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 — you will be redirected to /login.
Go to /register to create your first admin account.

---

## Project Structure

```
src/
 app/
    (auth)/           # Login & register pages
    (dashboard)/      # Protected dashboard pages
       dashboard/    # Overview + charts
       rooms/        # Room management
       bookings/     # Booking table + actions
       channels/     # OTA channel management
       calendar/     # Visual availability grid
       rates/        # Rate plan management
       analytics/    # Revenue & channel analytics
       properties/   # Property management
       settings/     # User & system settings
    api/              # REST API routes
 components/           # Reusable UI components
 hooks/                # React data-fetching hooks
 lib/                  # Auth, DB, validation, utils
 services/             # Business logic layer
 config/               # Constants & channel configs
 types/                # TypeScript type exports
```

---

## Channel Integration

### iCal Sync (works immediately)

1. Add channel  paste the iCal feed URL from OTA dashboard
2. Click Sync to pull bookings
3. Share your room iCal URL (shown in room card) with OTAs for two-way sync

### API Integration (requires OTA partner credentials)

Add API keys to `.env` (see `.env.example`). Requires partner/extranet account.

---

## Database

```bash
npx prisma studio          # GUI data browser
npx prisma migrate reset   # Reset (WARNING: deletes all data)
npx prisma generate        # Regenerate types after schema change
```

---

## Deployment

```bash
npm run build
npm start
```

Recommended: Vercel + Supabase/Neon/Railway PostgreSQL.
