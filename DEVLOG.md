# Casa Corona - Development Log

## Project Overview

- Nigerian marketplace for beauty/wellness/creative professionals
- Two user types: Customers (browse/book) and Vendors (list services)
- Stack: React 19 + TypeScript + Vite frontend, Express + Drizzle + PostgreSQL backend, Socket.io for chat
- Both light and dark theme support

## Architecture

```
apps/web/      - React 19 + Vite + Tailwind + Radix UI + shadcn
apps/api/      - Express 5 + TypeScript ESM + Drizzle ORM
packages/db/   - Drizzle schema (23 tables) + migrations
packages/api-spec/    - OpenAPI spec
packages/api-zod/     - Generated Zod schemas
packages/api-client-react/ - Generated fetch client
```

## Setup

```bash
pnpm install
# Backend
cd apps/api && npm run dev
# Frontend
cd apps/web && npm run dev
```

## Environment Variables

apps/api/.env needs:
- DATABASE_URL (Neon PostgreSQL)
- JWT_SECRET (min 32 chars)
- JWT_REFRESH_SECRET (min 32 chars)
- NODE_ENV (development|production)
- PORT (default 3001)
- CORS_ORIGIN (frontend URL)
- NODE_OPTIONS=--use-system-ca (REQUIRED for Node v24 + Neon TLS)

Optional:
- REDIS_URL (Upstash)
- RESEND_API_KEY (email)
- CLOUDINARY_* (image storage)
- PAYSTACK_* (payments)
- VAPID_* (push notifications)
- GOOGLE_* (OAuth)

## Database

- Provider: Neon serverless PostgreSQL
- 23 tables covering users, vendors, services, products, bookings, reviews, conversations, messages, etc.
- Run migrations: cd packages/db && pnpm db:migrate
- Run seed: cd packages/db && pnpm db:seed
- Admin-editable settings: platform_settings table (8 categories: pricing, subscription, chat, features, limits, content, geo, cron)

## Backend Modules (apps/api/src/modules/)

- auth/ - signup, login, OTP verify, JWT, refresh
- users/ - profile, settings, notifications
- vendors/ - CRUD, uploads, public detail
- services/ - CRUD
- products/ - CRUD
- portfolio/ - upload + display
- bookings/ - create, confirm, complete
- reviews/ - write, reply, helpful votes
- saved/ - bookmark vendors
- follows/ - follow vendors
- conversations/ + messages/ - chat
- notifications/ - in-app notifications
- search/ - search vendors with filters
- recommendations/ - for-you feed
- admin/ - admin dashboard endpoints
- settings/ - platform settings CRUD
- compliance/ - NDPR privacy/terms
- analytics/ - vendor analytics

## Frontend Pages

Public: Home, Browse, Vendor, Category, About, FAQ, Contact, Terms, Privacy
Auth: Login, Signup (5-step wizard), VerifyEmail
Customer: Dashboard, Saved, Following, Bookings, Reviews, Settings, Notifications, Messages
Vendor: Dashboard, Profile, Services, Products, Portfolio, Messages, Reviews, Analytics, Subscription, Settings
Admin: Dashboard, Vendors, Customers, Bookings, Analytics, Settings, FAQs, Announcements

## Bugs Found & Fixed

1. **T3 - Missing user columns**: users table missing city/state/bio; frontend silently dropped them. Fixed: added migration with ALTER TABLE.

2. **T4 - Portfolio image not displaying**: backend returns portfolioShots not portfolio. Fixed: updated frontend types + component.

3. **T7 - Real-time chat broken**: chat.gateway.ts had debug logs that were "cleaned up" but never re-tested. Fixed: reverted to clean version + verified test-socket.mjs.

4. **Phase 1 - Mock data still imported**: mock-data.ts wasn't actually deleted, just "minimized". Fixed: hard delete + grep to verify zero imports.

5. **Phase 2 - 5 bugs caught in verification**:
   - Neon DB paused (free tier auto-pause) — fixed with restart
   - Node v24 + Neon TLS cert — fixed with NODE_OPTIONS=--use-system-ca
   - /categories/:slug returned 404 — added alias route
   - Response shape mismatch (featuredVendors/recentVendors vs flat) — fixed types
   - VendorService field names (priceMin/durationMinutes vs price/duration) — fixed across 4 files

6. **Admin actions missing UI**: AdminVendors had no buttons. Fixed: full rewrite with AlertDialog confirmations + all admin endpoints wired.

7. **Vendor signup categories hardcoded**: Signup.tsx imported fake categories. Fixed: useEffect fetches from API.

8. **Wizard no review step**: handleProductNext jumped to redirect. Fixed: added StepReview component as step 6, handleSubmit creates vendor after OTP.

9. **OTP dev bypass broken**: Bypass logic was after Redis check (which was null in dev). Fixed: moved bypass BEFORE Redis check + complete flow.

10. **Demo accounts removed**: Removed demo accounts from Login.tsx (Bug E).

11. **Input cursor disappearing (Bug F)**: Cause: Context providers (AuthProvider, ThemeProvider) were recreating their context values on every render, leading to unnecessary re-renders of all consumers and inputs losing focus. Fixed: Used useCallback for all context functions and useMemo for context values to stabilize references.

## Patterns Learned

- ALWAYS run dev server and verify with curl/browser before declaring done
- Typecheck passing ≠ working code
- Backend "down" symptoms look like JSON parse errors in PowerShell
- Neon free tier pauses — restart before testing
- Node v24 needs --use-system-ca for Neon TLS
- Real Cloudinary credentials needed for production image upload (stub mode for dev)

## Known Limitations / TODOs

- Real Cloudinary credentials (currently using stub)
- Email service (Resend) — needs real key for prod
- Paystack payments (T6) — deferred per user request
- 646 pre-existing typecheck errors in apps/api (mostly Drizzle schema mismatches)
- Google OAuth (button shows but doesn't work)
- PWA service worker — manifest exists, full SW not wired
- Push notifications (VAPID keys present, not wired)
- Token denylist for logout (currently JWT stays valid until expiry)

## Deploy

See MIGRATION.md for full deployment guide.

## Testing

- Backend: PowerShell + curl with -UseBasicParsing
- Frontend: Browser at localhost:5173
- Admin login: admin@casacorona.org / admin123
- Dev OTP bypass: 000000 (only in development mode)

## Key Files for New Devs

- Backend entry: apps/api/src/index.ts
- Backend app: apps/api/src/app.ts
- Frontend entry: apps/web/src/main.tsx
- Frontend router: apps/web/src/App.tsx
- Auth flow: apps/web/src/context/AuthContext.tsx
- API client: apps/web/src/lib/api-client.ts
- DB schema: packages/db/src/schema/
- Settings: apps/api/src/modules/settings/settings.service.ts
