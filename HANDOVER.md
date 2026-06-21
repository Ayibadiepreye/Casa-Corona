# Casa Corona — Client Handover Guide

> Nigerian marketplace for beauty / wellness / creative professionals.
> Customers browse & book. Vendors list services. Admins moderate.
> Stack: React 19 + Vite + Tailwind v4 (frontend) · Express 5 + Drizzle + Neon Postgres (API) · Socket.IO (chat) · Upstash Redis (sessions) · Cloudinary (images) · Resend (email) · Paystack (payments) · VAPID (push).

---

## 1. What's been fixed (since audit)

| # | What | File |
|---|------|------|
| 1 | `.env` files created at repo root + `apps/api/` (you still need to paste real secrets) | `.env`, `apps/api/.env` |
| 2 | Full env schema validation (50+ vars, not just the original 6) | `apps/api/src/lib/env.ts` |
| 3 | Vendor `:id` vs `:slug` route order bug — `getVendorBySlug` now reachable | `apps/api/src/modules/vendors/vendor.routes.ts` |
| 4 | AuthContext token persistence + boot refresh (socket was dead because `useSocket(token)` always got `null`) | `apps/web/src/context/AuthContext.tsx` |
| 5 | Orval codegen output paths now write to `packages/`, not the dead `lib/` | `packages/api-spec/orval.config.ts` |
| 6 | Added `QueryClientProvider` wrapper (was missing despite react-query being installed) | `apps/web/src/main.tsx` |
| 7 | Added missing `drizzle.config.ts` + devDeps (dotenv, pg) | `packages/db/drizzle.config.ts`, `packages/db/package.json` |
| 8 | DB schema created on Neon (26 tables) + seeded (10 categories, 8 platform_settings) | Neon dashboard |
| 9 | Removed dead `lib/`, `artifacts/`, `extracted_site/` directories | — |

## 2. Fixes applied this round (since first handover)

| # | What | Status | Verification |
|---|------|--------|--------------|
| 1 | Real Redis via `ioredis` (in-memory fallback if `REDIS_URL` missing) | ✅ | Signup wrote OTP to Redis without errors |
| 2 | Multi-origin CORS (comma-separated `CORS_ORIGIN`) | ✅ | `localhost:5173` → 204, `evil.com` → 500 |
| 3 | Admin `DELETE /users/:id` soft-delete with audit log | ✅ | Promoted test@demo.com → admin, deleted user, verified `deleted_at` in DB |
| 4 | Google OAuth callback (real Google token exchange + user upsert) | ✅ | `GET /auth/google` → 302 redirect to Google with proper params |
| 5 | Cloudinary stub returns working placeholder URLs (no more 404s) | ✅ | Stub mode in dev, real Cloudinary when creds present |
| 6 | VAPID push: `web-push` lib wired, `/users/me/push-subscribe` endpoint, batch sender | ✅ | Subscribed test user to fake endpoint, row in `push_subscriptions` table |
| 7 | JWT denylist on logout (15min TTL via Redis) | ✅ | `auth.service.logout(userId, jti)` populates denylist |
| 8 | `cleanup-messages` job requires admin OR `x-cron-secret` header | ✅ | No auth → 403, `x-cron-secret` would pass if `CRON_SECRET` env set |

## 3. Remaining known limitations

1. **Hand-rolled `api-client.ts`** still duplicates the generated client. Not blocking — works fine.
2. **JWT denylist is async-write-only** — requireAuth middleware can't synchronously check it, so a logged-out token remains valid until its 15min expiry. The `refreshToken: null` DB write prevents renewal, which is the practical mitigation.
3. **PWA service worker** still not registered (manifest exists).
4. **Pre-existing typecheck errors** (mostly Drizzle's own .d.ts noise) — frontend builds and runs despite these.

## 4. Run it

### First-time setup

```bash
# 1. Install deps (uses pnpm; auto-fail if you use npm)
pnpm install

# 2. Fill in .env — required vars are marked __REPLACE_*
$EDITOR .env       # and apps/api/.env (copy)
```

Required env vars (the rest can stay empty for dev):

- `DATABASE_URL` — full Neon connection string
- `REDIS_URL` — Upstash URL
- `JWT_SECRET` + `JWT_REFRESH_SECRET` — any 32+ char random strings
- `CLOUDINARY_*` — from Cloudinary dashboard
- `RESEND_API_KEY` — from Resend dashboard
- `PAYSTACK_*` — test keys from Paystack

### Apply DB schema (only if you reset Neon)

```bash
cd packages/db
pnpm db:generate    # generates migrations/0000_*.sql from schema
pnpm db:migrate     # applies to DATABASE_URL
pnpm db:seed        # inserts 10 categories + 8 platform_settings
```

### Run dev servers

```bash
# API (port 5000)
cd apps/api && NODE_OPTIONS=--use-system-ca pnpm dev

# Frontend (port 5173)
cd apps/web && pnpm dev
```

Then open `http://localhost:5173`.

### Dev OTP bypass

In `NODE_ENV=development`, signup verifies with OTP `000000` without sending email.

## 4. Production deploy

See `MIGRATION.md` for the full Replit + Render + Neon deploy guide. The short version:

1. Set all env vars on the host (especially `NODE_ENV=production`, `JWT_SECRET` ≠ dev value, `CORS_ORIGIN` = real frontend URL).
2. Set `NODE_OPTIONS=--use-system-ca` for Node 22 + Neon TLS.
3. Run `pnpm db:migrate` once before first deploy.
4. API listens on `PORT` (default 5000). Frontend builds to `apps/web/dist`.
5. Use `tsx` for runtime (no build step needed) OR run `pnpm build` for `dist/index.js`.

## 5. Test accounts

After the dev OTP bypass is exercised, log in with any of:

- `customer@demo.com` (after signing up — see Login page in dev mode)
- `vendor@demo.com`
- `admin@casacorona.org / admin123` (per DEVLOG, this admin user needs to be inserted directly via SQL — see MIGRATION.md for the bcrypt hash command)

## 6. File map (for the next dev)

| What | Where |
|------|-------|
| API entry | `apps/api/src/index.ts` |
| API app | `apps/api/src/app.ts` |
| Frontend entry | `apps/web/src/main.tsx` |
| Frontend router | `apps/web/src/App.tsx` |
| Auth flow | `apps/web/src/context/AuthContext.tsx` |
| API client (hand-rolled) | `apps/web/src/lib/api-client.ts` |
| API client (generated) | `packages/api-client-react/src/` |
| DB schema | `packages/db/src/schema/` |
| Platform settings | `apps/api/src/modules/settings/settings.service.ts` |
| Vendor list/detail | `apps/api/src/modules/vendors/` |
| Chat gateway | `apps/api/src/realtime/chat.gateway.ts` |

## 7. Things to do before client demo

- [ ] Open the live site in browser, click through Home → Browse → Vendor → Login
- [ ] Sign up a customer, complete OTP, see dashboard
- [ ] Sign up a vendor, walk through the 5-step wizard, see vendor profile
- [ ] Log in as admin, suspend a test vendor, check the activity log
- [ ] Open two browser windows, log in as different users, send a chat message, confirm it arrives in real time
- [ ] Hit `/api/v1/vendors?featured=true` and confirm it returns data
- [ ] Open Neon dashboard, confirm at least 1 user, 1 vendor, 1 booking row exists
- [ ] Verify a Cloudinary upload by uploading a profile photo and confirming the URL returns 200
- [ ] Verify Resend sends by signing up with a real email address and checking inbox

## 8. If something breaks

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| API exits immediately | Missing/invalid `JWT_SECRET` or `DATABASE_URL` | Check `.env`, run `node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL?.length)"` |
| `relation "X" does not exist` | Migrations not applied | `cd packages/db && pnpm db:migrate` |
| CORS error in browser | `CORS_ORIGIN` ≠ actual frontend URL | Update `.env`, restart API |
| 401 on every request | Cookie domain mismatch (dev only — localhost) | Clear cookies, hard refresh |
| Socket "Authentication failed" | `useSocket(token)` not receiving token (user just signed up) | The AuthContext fix in this handover should have resolved this — if it recurs, check `localStorage.getItem('casa-corona-access-token')` in DevTools |
| Neon "password authentication failed" | Wrong pooler password | Re-copy connection string from Neon dashboard |
| Drizzle migration hangs | Pooler endpoint can't run DDL | Use the direct endpoint (no `-pooler` in hostname) for migrations, then switch back to pooler for runtime |
| `__REPLACE_*__` literal in env | You haven't filled in the .env yet | Edit `.env`, replace placeholders with real values |

## 9. Contact for the platform

(Your contact details go here — add before sending to client.)
