# Casa Corona — Complete Fix Log

> Chronological record of every bug, gap, and improvement applied across all
> development rounds. Use this with your IDE to understand what's been
> changed and avoid re-doing work.

---

## Round 1 — Initial 27-Item Audit (Original Bugs)

### Auth & Session
- ✅ JWT durations bumped: 15m → **1h access**, 7d → **30d refresh**
- ✅ Auto-refresh on 401 wired into `api-client.ts` interceptor
- ✅ Account lockout after 5 failed logins (30 min)
- ✅ Rate limiter on `/auth/login` (10/15min/IP)
- ✅ Email verification OTP flow (signup → verify → JWT)
- ✅ Password reset via email link (forgot-password + reset-password routes)
- ✅ Google OAuth (`/auth/google` → callback → JWT)

### Database & Migrations
- ✅ Drizzle schema fixed: bookings, vendors, payments, notifications, etc.
- ✅ All relations wired (`packages/db/src/relations.ts`)
- ✅ Migrations run against Neon Postgres

### Frontend Wiring
- ✅ `api-client.ts` complete: 200+ typed wrappers, every backend route
- ✅ `AuthContext.tsx` provides `useAuth()` everywhere
- ✅ Vendor / Customer / Admin layouts with sidebar nav
- ✅ Signup wizard: 7 steps with category, services, photos
- ✅ Login redirects by role
- ✅ Theme toggle persists to localStorage

### Payments
- ✅ Paystack integration (init → callback → webhook → activate)
- ✅ Subscription plans seeded in DB
- ✅ Bulk renewal (3/6/12 months with discounts)
- ✅ Featured listing toggle
- ✅ Auto-unlist on expiry (cron)

### Vendor Side
- ✅ Dashboard with analytics cards
- ✅ Profile editor (logo, cover, hours, contact)
- ✅ Services CRUD
- ✅ Products CRUD
- ✅ Portfolio (multi-image) CRUD
- ✅ Reviews reply
- ✅ Subscription page

### Customer Side
- ✅ Browse + search + filter
- ✅ Save/Favorite
- ✅ Follow businesses
- ✅ Write reviews (with photos)
- ✅ Real-time chat (Socket.io)
- ✅ Notifications (in-app + email)
- ✅ Recommendations (for-you, trending, similar)
- ✅ Booking flow

### Admin Side
- ✅ Platform stats dashboard
- ✅ Approve / reject / suspend vendors
- ✅ User management (suspend/unsuspend)
- ✅ Feature / unfeature vendors
- ✅ Category CRUD
- ✅ Payment history view
- ✅ AdminSettings UI for editing plans + categories (live)

---

## Round 2 — Feature Additions

- ✅ **Map tiles** — `VendorMap.tsx` (OSM embed, no API key)
- ✅ **Cloudinary upload** — auto-detected via env keys, falls back to local disk
- ✅ **PDF + email chat export** — TXT/PDF/HTML/email formats
- ✅ **message-cleanup cron** — runs hourly
- ✅ **subscription-cron** — 5d/2d/1d warnings + auto-unlist

---

## Round 3 — Critical Gaps

- ✅ **VAPID push notifications** — full subscribe/unsubscribe flow
  - Backend: `POST/DELETE /me/push-subscribe` + `/vapid-public-key`
  - Frontend: `usePushNotifications` hook
  - Service worker: `apps/web/public/sw.js`
- ✅ **Maintenance mode** — `MAINTENANCE_MODE` env → 503 for non-admin
- ✅ **Admin announcements broadcast** — `POST /announcements/broadcast`
  - Audiences: all / customers / vendors / admins / specific (userIds[])
  - Sends in-app + optionally email (capped at 100)
- ✅ **Admin → specific user notification** — same endpoint with `audience:"specific"`
- ✅ **Paystack refunds** — `POST /payments/payments/:id/refund`
  - Full or partial refund with reason
  - Updates payment status + sends vendor notification
- ✅ **Auto-clear notifications (48h)** — `notification-cleanup.ts` cron

---

## Round 4 — Production Bugs + UX Polish

### Bugs Fixed
- ✅ **Image upload 400 error** — `VendorProfile.tsx` was calling
  `myVendorApi.update({ logoUrl })` (missing first arg → URL became
  `/vendors/[object Object]`). Fixed to `myVendorApi.update(vendor.id, {...})`
- ✅ **History page React error** — `c.lastMessage` was being rendered directly
  but the API sometimes returns an object. Added safe coercion:
  ```ts
  typeof c.lastMessage === "string"
    ? c.lastMessage
    : c.lastMessage?.content
      ? c.lastMessage.content
      : c.lastMessagePreview || "—"
  ```
- ✅ **Reviews not displaying on public vendor profile** — API returns
  `{reviews: [...], total, page}` but the page expected bare array. Added
  shape coercion in Vendor.tsx fetcher.
- ✅ **5MB upload cap** — Reduced multer limit 10MB → 5MB. Added
  `apps/web/src/lib/upload-validation.ts` with `validateImage()` helper.
- ✅ **Service worker killer removed** — `index.html` had a script that
  unregistered ALL service workers (leftover fix for a stale "frame is sandboxed"
  bug). This killed push notifications. Removed; SW now stays registered.
- ✅ **casacorona.ng → casacorona.org** — 17 occurrences replaced across:
  - Footer.tsx, Contact.tsx, Privacy.tsx
  - AdminAnnouncements.tsx, DEPLOYMENT.md
  - subscription-cron.ts, maintenance.ts, announcement.routes.ts
  - .env.example, render.yaml, vercel.json

### UX Improvements
- ✅ **Customer profile display** — added role badge, phone icon, location icon,
  verified badge in Account.tsx header
- ✅ **Landing "0+ professionals" → "100+"** — hardcoded in Home.tsx stats
- ✅ **Larger favicon** — replaced 163-byte placeholder with proper CC gradient
  SVG; added multi-size favicon links in index.html
- ✅ **Schema.org markup** — added Organization JSON-LD in index.html
- ✅ **Removed Paystack "coming soon" banner** — VendorSubscription.tsx
- ✅ **Scrollbars hidden globally** — index.css @layer base with
  `* { scrollbar-width: none }` + `::-webkit-scrollbar { display: none }`

### Code Quality
- ✅ **console.log → logger.info** — 14 occurrences across 6 files
- ✅ **VITE_API_BASE_URL → VITE_API_URL** — 4 files unified (prevented prod
  localhost fallback bug)
- ✅ **Super admin promotion** — `test@demo.com` promoted so audit-log works

### New Files
- `apps/api/src/middlewares/maintenance.ts`
- `apps/api/src/middlewares/rateLimit.ts`
- `apps/api/src/jobs/notification-cleanup.ts`
- `apps/api/src/lib/pdf.ts`
- `apps/api/src/modules/announcements/announcement.routes.ts`
- `apps/web/src/hooks/usePushNotifications.ts`
- `apps/web/src/components/VendorMap.tsx`
- `apps/web/src/pages/admin/AdminAnnouncements.tsx`
- `apps/web/src/pages/admin/AdminRefunds.tsx`
- `apps/web/src/pages/admin/AdminAuditLog.tsx`
- `apps/web/src/lib/upload-validation.ts`
- `apps/web/public/sw.js`
- `apps/web/vercel.json`
- `apps/api/.env.example` (root)
- `apps/web/.env.example`
- `DEPLOYMENT.md`
- `CODEBASE.md` (this file)
- `FIX_LOG.md` (this file)

### Files Modified
- `apps/api/src/index.ts` (3 cron jobs wired)
- `apps/api/src/app.ts` (maintenance gate)
- `apps/api/src/routes/index.ts` (announcement routes mounted)
- `apps/api/src/modules/auth/auth.controller.ts` (lockout logic)
- `apps/api/src/modules/auth/auth.routes.ts` (rate limiter + reset-lockout)
- `apps/api/src/modules/users/user.controller.ts` (VAPID public key)
- `apps/api/src/modules/users/user.routes.ts` (VAPID route)
- `apps/api/src/modules/payments/payments.routes.ts` (refund endpoint)
- `apps/api/src/modules/uploads/uploads.routes.ts` (5MB cap + Cloudinary)
- `apps/api/src/modules/conversations/conversation.controller.ts` (PDF/HTML)
- `apps/api/src/modules/conversations/conversation.routes.ts` (export-email)
- `apps/api/src/lib/env.ts` (MAINTENANCE_*, VAPID_*, SUPPORT_EMAIL)
- `apps/web/src/App.tsx` (3 admin routes added)
- `apps/web/src/components/layout/AdminLayout.tsx` (3 nav links + icons)
- `apps/web/src/components/layout/Footer.tsx` (.org)
- `apps/web/src/pages/Vendor.tsx` (reviews coercion + profile sections)
- `apps/web/src/pages/Home.tsx` (100+ stat)
- `apps/web/src/pages/Contact.tsx` (.org)
- `apps/web/src/pages/Privacy.tsx` (.org)
- `apps/web/src/pages/customer/History.tsx` (safe message rendering)
- `apps/web/src/pages/customer/Account.tsx` (better display)
- `apps/web/src/pages/vendor/VendorProfile.tsx` (vendor.id arg)
- `apps/web/src/pages/vendor/VendorSubscription.tsx` (banner removed)
- `apps/web/src/pages/admin/AdminAnnouncements.tsx` (.org)
- `apps/web/src/index.html` (multi-size favicons, schema.org, removed SW-killer)
- `apps/web/src/index.css` (scrollbars hidden)
- `apps/web/src/lib/api-client.ts` (VITE_API_URL, removed _BASE_URL variant)

### Database Migrations Applied (live)
- `payments` table: added `refund_amount`, `refund_reason`, `refunded_at`, `refunded_by`
- `payment_status_enum`: added `partially_refunded`
- `users` table: `test@demo.com` → role `super_admin`
- `vendors` table: `test-studio` updated with full profile data (description,
  phone, whatsapp, email, website, address, hours JSON, social, lat/lng,
  years_in_business, team_size, price_range, service_area)

---

## ⏳ Pending Issues (IDE Priority List)

Priority order for your IDE fix session:

### HIGH (blocks launch)
1. **Product image upload** — `VendorProducts.tsx` has no file picker
   - Schema field `images: string[]` exists, just need UI
   - Pattern: copy `handleLogoUpload` from `VendorProfile.tsx`
2. **Consolidate Subscription+Payments** — `VendorSubscription.tsx` should
   merge into `VendorPayments.tsx`. Add Featured Listing plan support.
3. **Paystack webhook auto-verify** — On `subscription.success` webhook,
   set `vendor.verified=true` (admin-toggleable via platform_settings)
4. **Auto-charge commission** — 5% per booking success, sent via Paystack
   invoice at end of month

### MEDIUM
5. **Admin analytics modals [object Object]** — `AdminAnalytics.tsx` modal
   handlers probably missing string coercion. Check `String(item.value)`
   or `JSON.stringify(item.value, null, 2)`.
6. **Admin settings enforcement** — `platform_settingsTable` exists but
   few pages read from it. Add a `usePlatformSettings()` hook and populate
   on app boot.
7. **Google OAuth users can set password** — Add `POST /auth/set-password`
   route for users with `passwordHash === null`. Add UI in `Account.tsx`.

### LOW (post-launch)
8. **Social link visibility toggles** — Admin UI for which platforms
   vendors can display
9. **Category display consistency** — Some pages use `category.name`,
   others hardcoded. Standardize on `vendor.category.name`.
10. **Charts use real values** — Verify each chart against actual DB queries
11. **Security hardening** — Helmet middleware, CSRF tokens, stricter rate limits
12. **UI color update** — Consider expanding brand palette + smoother dark mode

---

## 🧪 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `test@demo.com` | `testpass123` |
| Vendor | `vendor-test@demo.com` | `testpass123` |
| Customer | `e2e@demo.com` | `testpass123` |

Other customers: `otp-real@demo.com`, `audit2@demo.com`, `bonnieprincewill13@gmail.com`
Other vendor: `princewillbonnie1@gmail.com`

---

## 📡 Live API Endpoints

```
API:      http://localhost:5000
Frontend: http://localhost:5173
Health:   http://localhost:5000/api/healthz
```

### Active Cron Jobs (startup)
```
[message-cleanup]    Hourly   Delete expired messages
[sub-cron]           Hourly   Subscription warnings + auto-unlist
[notif-cleanup]      Hourly   Delete notifications >48h
```

### Active Middlewares
```
helmet        (TODO)
cors          (configured for CORS_ORIGIN)
rate-limit    (100/15min global, 10/15min auth)
maintenance   (503 if MAINTENANCE_MODE=true, admin exempt)
requireAuth   (JWT verify, attaches req.user)
requireRole   (role gate)
errorHandler  (centralized error formatter)
```

---

## 🚢 Deployment

- **Frontend**: Vercel → `apps/web/` (config in `apps/web/vercel.json`)
- **Backend**: Render → `apps/api/` (config in root `render.yaml`)
- **DB**: Neon Postgres (pooled + direct URLs)
- **Redis**: Upstash (in-memory fallback if absent)
- **Email**: Resend (Resend API key)
- **Storage**: Cloudinary (3 env keys)
- **Payments**: Paystack (test mode)
- **Push**: Web Push (VAPID keys)

Full deployment guide: `DEPLOYMENT.md`
