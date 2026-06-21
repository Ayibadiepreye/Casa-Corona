# Casa Corona — Codebase Reference

> Complete map of the Casa Corona monorepo. Use this with your IDE to navigate,
> edit, or extend the platform without re-reading every file.

---

## 🏗️ Monorepo Structure

```
Casa-Corona-main/
├── apps/
│   ├── api/                    ← Node + Express + Socket.io backend (port 5000)
│   └── web/                    ← Vite + React + Wouter frontend (port 5173)
├── packages/
│   ├── db/                     ← Drizzle ORM schema + migrations (Neon Postgres)
│   ├── api-client-react/       ← Generated React Query hooks (legacy)
│   ├── api-spec/               ← OpenAPI spec
│   └── api-zod/                ← Generated Zod schemas from OpenAPI
├── scripts/                    ← Build helpers + proof scripts
├── artifacts/                  ← Historical dev artifacts (ignore in prod)
├── .env                        ← Live environment variables (DO NOT COMMIT)
├── .env.example                ← Template for new environments
├── render.yaml                 ← Render deployment blueprint
├── DEPLOYMENT.md               ← Full deployment guide
└── package.json                ← pnpm workspace root
```

**All commands run from repo root** with `pnpm --filter @casa-corona/<pkg> <cmd>`.

---

## 📦 Apps — `apps/api` (Backend)

### Layout
```
apps/api/
├── src/
│   ├── index.ts                ← Server entry, mounts HTTP + Socket.io, starts crons
│   ├── app.ts                  ← Express app factory (middleware + routes)
│   ├── lib/                    ← Shared utilities
│   │   ├── env.ts              ← Zod-validated env loader
│   │   ├── jwt.ts              ← Access (1h) + refresh (30d) tokens
│   │   ├── password.ts         ← bcrypt
│   │   ├── redis.ts            ← In-memory fallback when REDIS_URL absent
│   │   ├── email.ts            ← Resend wrapper + dev preview
│   │   ├── pdf.ts              ← Pure-JS PDF generator (no deps)
│   │   ├── upload.ts           ← Cloudinary helpers
│   │   ├── logger.ts           ← Pino logger
│   │   ├── errors.ts           ← Custom error classes
│   │   ├── response.ts         ← ok() / created() / badRequest() etc
│   │   └── socket.ts           ← Socket.io init
│   ├── middlewares/
│   │   ├── requireAuth.ts      ← JWT verification, attaches req.user
│   │   ├── requireRole.ts      ← Role gate (admin, super_admin, vendor, customer)
│   │   ├── errorHandler.ts     ← Centralized error formatter
│   │   ├── rateLimit.ts        ← express-rate-limit + per-account lockout
│   │   └── maintenance.ts      ← MAINTENANCE_MODE 503 gate
│   ├── jobs/                   ← Cron jobs (run on boot)
│   │   ├── message-cleanup.ts        ← Hourly: delete expired chat messages
│   │   ├── subscription-cron.ts      ← Hourly: 5d/2d/1d warnings + auto-unlist
│   │   └── notification-cleanup.ts   ← Hourly: delete notifications >48h old
│   ├── realtime/
│   │   ├── chat.gateway.ts           ← Socket.io chat namespace
│   │   └── notification.gateway.ts   ← Socket.io notifications namespace
│   ├── modules/                ← Feature modules (route + controller + service)
│   │   ├── auth/                    ← signup, login, refresh, verify-otp, google, forgot/reset password
│   │   ├── users/                   ← getMe, updateProfile, push subscribe/unsubscribe, exports
│   │   ├── vendors/                 ← CRUD, services, products, portfolio, reviews, save, follow, analytics
│   │   ├── bookings/                ← Create/cancel/complete bookings
│   │   ├── conversations/          ← Chat list, messages, export (TXT/PDF/HTML), email export
│   │   ├── payments/                ← Plans CRUD, subscribe, webhooks, refunds
│   │   ├── notifications/           ← List + mark-read
│   │   ├── announcements/           ← Broadcast to all/customers/vendors/admins/specific
│   │   ├── uploads/                 ← Generic image upload (5MB cap, Cloudinary or local)
│   │   ├── admin/                   ← Platform stats, vendor mgmt, user mgmt, audit log
│   │   ├── analytics/               ← Track + read vendor analytics
│   │   ├── recommendations/         ← for-you, trending-near-you, similar
│   │   ├── search/                  ← Full-text vendor search
│   │   ├── settings/                ← Platform settings (admin-editable)
│   │   ├── compliance/              ← NDPR data export + account deletion
│   │   ├── categories/              ← CRUD categories
│   │   ├── follows/                 ← Follow/unfollow
│   │   ├── saved/                   ← Save/unsave vendors
│   │   ├── reviews/                 ← Create/edit/delete reviews
│   │   ├── services/                ← Vendor service CRUD
│   │   ├── products/                ← Vendor product CRUD
│   │   ├── portfolio/               ← Vendor portfolio CRUD
│   │   └── ...
│   └── routes/                 ← Top-level route index
│       ├── index.ts                 ← Aggregates all modules under /api/v1
│       └── health.routes.ts         ← /api/healthz
├── package.json
├── tsconfig.json
└── api.log                     ← Runtime log (when started with nohup-style)
```

### Auth flow
1. `POST /api/v1/auth/signup` → creates user, sends OTP via email
2. `POST /api/v1/auth/verify-otp` → marks `emailVerified=true`
3. `POST /api/v1/auth/login` → returns `{accessToken, refreshToken, user}` + httpOnly cookies
4. `POST /api/v1/auth/refresh` → rotates access token
5. All protected routes: `Authorization: Bearer <token>` OR `cc_access_token` cookie
6. `requireRole('admin')` gate after `requireAuth`

### Rate limiting
- **Global**: 100 req / 15 min / IP (skipped in `NODE_ENV=test`)
- **Auth**: 10 attempts / 15 min / IP via `authLimiter`
- **Account lockout**: 5 failed logins → 30 min lockout per email
- Reset endpoint: `POST /api/v1/auth/reset-lockout` (admin only)

### Cron jobs (3 active)
```
[message-cleanup]   Hourly   Delete chat messages with expiresAt < now
[sub-cron]          Hourly   5d/2d/1d expiry warnings + auto-unlist expired subs
[notif-cleanup]     Hourly   Delete in-app notifications >48h old
```

### Environment variables (see .env.example)
```
NODE_ENV, PORT,
DATABASE_URL, DIRECT_URL, REDIS_URL,
CORS_ORIGIN,
JWT_SECRET, JWT_REFRESH_SECRET,
PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY,
RESEND_API_KEY, EMAIL_FROM,
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI,
VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
MAINTENANCE_MODE, MAINTENANCE_MESSAGE, SUPPORT_EMAIL
```

---

## 📦 Apps — `apps/web` (Frontend)

### Layout
```
apps/web/
├── public/
│   ├── favicon.svg           ← Updated CC gradient logo
│   ├── logo.png              ← Primary logo (416KB)
│   ├── logo.jpg              ← JPG version
│   ├── opengraph.jpg         ← OG social card
│   ├── sw.js                 ← Service worker (push notifications)
│   ├── manifest.json         ← PWA manifest
│   ├── robots.txt
│   └── offline.html          ← PWA offline fallback
├── src/
│   ├── main.tsx              ← Entry, wraps with AuthProvider + ThemeProvider
│   ├── App.tsx               ← Router (Wouter) — all routes
│   ├── index.css             ← Tailwind + design tokens (HIDE SCROLLBARS here)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx        ← Sidebar + content
│   │   │   ├── CustomerLayout.tsx     ← Sidebar + content
│   │   │   ├── VendorLayout.tsx       ← Sidebar + content
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── PublicLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── ui/                ← shadcn primitives (button, card, dialog, etc.)
│   │   ├── BookingModal.tsx
│   │   ├── BusinessCard.tsx
│   │   ├── CookieConsent.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── VendorMap.tsx      ← OSM embed for public profile
│   ├── context/
│   │   └── AuthContext.tsx    ← useAuth() → user, login(), logout(), refresh()
│   ├── hooks/
│   │   ├── useApi.ts          ← Generic fetch wrapper
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useSocket.ts
│   │   └── usePushNotifications.ts  ← Service worker push subscribe
│   ├── lib/
│   │   ├── api-client.ts      ← Typed fetch wrappers for every API
│   │   ├── utils.ts           ← formatNaira, cn, initials
│   │   └── upload-validation.ts ← 5MB + type validation
│   └── pages/
│       ├── Home.tsx              ← Landing page
│       ├── Browse.tsx            ← Vendor browse + filters
│       ├── Category.tsx          ← Category-filtered browse
│       ├── Vendor.tsx            ← Public vendor profile (slug-based)
│       ├── auth/
│       │   ├── Login.tsx
│       │   ├── Signup.tsx
│       │   ├── ForgotPassword.tsx
│       │   └── VerifyEmail.tsx
│       ├── customer/
│       │   ├── Account.tsx          ← Profile + avatar
│       │   ├── Bookings.tsx
│       │   ├── Saved.tsx
│       │   ├── Following.tsx
│       │   ├── History.tsx          ← Chat history
│       │   ├── Notifications.tsx
│       │   ├── CustomerMessages.tsx
│       │   ├── CustomerSettings.tsx
│       │   └── MyReviews.tsx
│       ├── vendor/
│       │   ├── VendorDashboard.tsx
│       │   ├── VendorProfile.tsx    ← Logo + cover upload (FIXED)
│       │   ├── VendorServices.tsx
│       │   ├── VendorProducts.tsx   ← Add image upload (PENDING)
│       │   ├── VendorPortfolio.tsx
│       │   ├── VendorReviews.tsx
│       │   ├── VendorMessages.tsx
│       │   ├── VendorAnalytics.tsx
│       │   ├── VendorSubscription.tsx
│       │   ├── VendorPayments.tsx   ← CONSOLIDATE (PENDING)
│       │   ├── VendorSettings.tsx
│       │   └── VendorBookings.tsx
│       └── admin/
│           ├── AdminOverview.tsx
│           ├── AdminDashboard.tsx
│           ├── AdminAnalytics.tsx    ← Modal [object Object] (PENDING)
│           ├── AdminVendors.tsx
│           ├── AdminCustomers.tsx
│           ├── AdminBookings.tsx
│           ├── AdminSettings.tsx     ← Plans + categories editor
│           ├── AdminAnnouncements.tsx
│           ├── AdminRefunds.tsx
│           └── AdminAuditLog.tsx
├── index.html               ← Favicons, OG tags, schema.org JSON-LD
├── vercel.json              ← Vercel build config
├── package.json
├── tsconfig.json
├── vite.config.ts
├── components.json          ← shadcn config
└── web.log                  ← Vite dev log
```

### Frontend conventions
- **Routing**: `wouter` (NOT react-router). Use `<Link href="/path">` and `useLocation()`
- **API client**: All requests go through `apps/web/src/lib/api-client.ts`. NEVER use raw `fetch()` in components.
- **Auth**: `useAuth()` returns `{user, isLoading, login(), logout(), refresh()}`. Backend uses cookies + Authorization header (we set both).
- **Env var**: Single source of truth is `VITE_API_URL` (e.g. `https://api.casacorona.org/api/v1`).
- **Forms**: shadcn `Form` + react-hook-form + zod resolver. No uncontrolled inputs.
- **Toasts**: `useToast()` from `@/hooks/use-toast`.
- **Data fetching**: `useApi(() => api.x.y(), [deps])` returns `{data, loading, error, refetch}`.

---

## 📦 Packages — `packages/db`

### Schema files (`packages/db/src/schema/`)
| File | Tables |
|------|--------|
| `users.ts` | users, pushSubscriptions (lives here too) |
| `vendors.ts` | vendors |
| `services.ts` | services |
| `products.ts` | products |
| `portfolio.ts` | portfolio_shots |
| `reviews.ts` | reviews |
| `bookings.ts` | bookings |
| `conversations.ts` | conversations, messages |
| `payments.ts` | payments, subscriptionPlans |
| `notifications.ts` | notifications |
| `admin.ts` | auditLogs, announcements, platformSettings, faqs, loginHistory, featuredRotation, savedSearches, pushSubscriptions |
| `categories.ts` | categories |
| `saved.ts` | savedVendors |
| `follows.ts` | follows |
| `index.ts` | barrel export |

### Migrations
- Generated via Drizzle Kit
- Run: `pnpm --filter @casa-corona/db generate` + `pnpm --filter @casa-corona/db migrate`
- Latest migrations in `packages/db/migrations/`

---

## 🔑 Critical API Endpoints

### Public
```
GET  /api/healthz                                    ← Service health
GET  /api/v1/vendors                                  ← Browse + filter
GET  /api/v1/vendors/:slug                            ← Public profile
GET  /api/v1/vendors/:id/reviews                      ← Reviews
GET  /api/v1/vendors/:id/services
GET  /api/v1/vendors/:id/products
GET  /api/v1/vendors/:id/portfolio
GET  /api/v1/categories                               ← All categories
GET  /api/v1/search/vendors?q=                        ← Full-text search
GET  /api/v1/recommendations/for-you                  ← Authenticated
GET  /api/v1/recommendations/trending-near-you
GET  /api/v1/recommendations/similar/:id
GET  /api/v1/announcements/maintenance                ← Public maintenance status
POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/verify-otp
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/google                              ← OAuth redirect
GET  /api/v1/auth/google/callback
```

### Customer (requireAuth)
```
GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/me/notifications
PATCH  /api/v1/users/me/notifications/:id/read
DELETE /api/v1/users/me                                ← NDPR account delete
GET    /api/v1/users/me/export                         ← NDPR data export
POST   /api/v1/vendors/:id/save
DELETE /api/v1/vendors/:id/save
POST   /api/v1/vendors/:id/follow
DELETE /api/v1/vendors/:id/follow
POST   /api/v1/vendors/:id/reviews
PATCH  /api/v1/reviews/:id
DELETE /api/v1/reviews/:id
GET    /api/v1/conversations
POST   /api/v1/conversations
GET    /api/v1/conversations/:id/messages
POST   /api/v1/conversations/:id/messages
GET    /api/v1/conversations/:id/export?format=txt|pdf|html
POST   /api/v1/conversations/:id/export-email
POST   /api/v1/bookings
GET    /api/v1/bookings/me
POST   /api/v1/me/push-subscribe
DELETE /api/v1/me/push-subscribe
GET    /api/v1/me/push-subscribe/vapid-public-key
```

### Vendor (requireAuth + role:vendor)
```
GET    /api/v1/vendors/me
PATCH  /api/v1/vendors/me
POST   /api/v1/vendors/me/logo                        ← Multipart
POST   /api/v1/vendors/me/cover                       ← Multipart
GET    /api/v1/vendors/me/services
POST   /api/v1/vendors/me/services
PATCH  /api/v1/vendors/me/services/:id
DELETE /api/v1/vendors/me/services/:id
GET    /api/v1/vendors/me/products
POST   /api/v1/vendors/me/products
PATCH  /api/v1/vendors/me/products/:id
DELETE /api/v1/vendors/me/products/:id
GET    /api/v1/vendors/me/portfolio
POST   /api/v1/vendors/me/portfolio                   ← Multipart
DELETE /api/v1/vendors/me/portfolio/:id
GET    /api/v1/analytics/vendor/me
```

### Admin (requireAuth + role:admin|moderator|super_admin)
```
GET    /api/v1/admin/platform                         ← Platform stats
GET    /api/v1/admin/users                            ← User list
PATCH  /api/v1/admin/users/:id/suspend
PATCH  /api/v1/admin/users/:id/unsuspend
PATCH  /api/v1/admin/users/:id/role
GET    /api/v1/admin/vendors
PATCH  /api/v1/admin/vendors/:id                      ← verify/feature/suspend
POST   /api/v1/admin/vendors/bulk-approve
DELETE /api/v1/admin/vendors/:id
GET    /api/v1/admin/categories
POST   /api/v1/admin/categories
PATCH  /api/v1/admin/categories/:id
DELETE /api/v1/admin/categories/:id
GET    /api/v1/admin/audit-logs                       ← requireRole:super_admin
GET    /api/v1/admin/system-health
GET    /api/v1/admin/faqs
POST   /api/v1/admin/faqs
PATCH  /api/v1/admin/faqs/:id
DELETE /api/v1/admin/faqs/:id
GET    /api/v1/admin/settings
PATCH  /api/v1/admin/settings/:key
POST   /api/v1/announcements/broadcast
GET    /api/v1/payments/payments                      ← All payments
POST   /api/v1/payments/payments/:id/refund
GET    /api/v1/payments/plans/all
POST   /api/v1/payments/plans
PATCH  /api/v1/payments/plans/:id
```

### Payments (public + auth)
```
POST   /api/v1/payments/subscribe                     ← Returns Paystack checkout URL
POST   /api/v1/payments/verify/:reference              ← Confirm transaction
GET    /api/v1/payments/plans                         ← Public: active plans
POST   /api/v1/payments/webhook                        ← Paystack webhook (HMAC verified)
```

### Uploads (requireAuth)
```
POST   /api/v1/uploads/images                         ← Multipart, max 5MB, max 6 files
                                                       Returns {urls, storage: "cloudinary"|"local"}
```

---

## 🎨 Design System

### Colors (in `apps/web/src/index.css`)
```css
--primary:        #FF3C00  (orange-red brand)
--primary-foreground: white
--background:     #FAFAF8
--foreground:     #1A1A1A
--border:         #E5E5E5
--muted:          #F4F4F2
--muted-foreground: #6B6B6B
--accent:         #FFF8F3  (light orange tint)
--destructive:    #DC2626
```

### Typography
- **Sans**: Inter (Google Fonts, body)
- **Serif**: ui-serif/Georgia (headings, "font-serif")
- **Sizes**: Tailwind default scale

### Spacing
- All `p-`/`m-` are Tailwind defaults (4px base)
- Container: `max-w-2xl` (forms), `max-w-5xl` (dashboards), `max-w-7xl` (full)

---

## 🚀 Deployment

### Vercel (frontend)
- Root: `apps/web`
- Build: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @casa-corona/web build`
- Output: `dist`
- Env: `VITE_API_URL=https://api.casacorona.org/api/v1`

### Render (backend)
- Blueprint: `render.yaml`
- Root: `apps/api`
- Build: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @casa-corona/db build && pnpm --filter @casa-corona/api build`
- Start: `cd apps/api && node dist/index.js`
- Health: `/api/healthz`

### Database (Neon)
- Pooled connection for app
- Direct connection for migrations
- Always SSL required

---

## 🐛 Known Issues / TODOs (For IDE Fixes)

See `FIX_LOG.md` for the complete history of applied fixes.

### Pending (priority order)

1. **Product image upload** (`apps/web/src/pages/vendor/VendorProducts.tsx`)
   - Schema has `images: string[]` field but UI doesn't upload
   - Add file picker + upload handler in ProductForm
   - Reference: `VendorProfile.tsx` `handleLogoUpload` for pattern

2. **Consolidate Subscription + Payments** (`apps/web/src/pages/vendor/`)
   - Delete `VendorSubscription.tsx`, fold content into `VendorPayments.tsx`
   - Add Featured Listing plan support (Paystack plan with `featured: true` boost)
   - On payment webhook success: set `vendor.featured=true`, `featuredUntil=now+duration`

3. **Admin analytics modals** (`apps/web/src/pages/admin/AdminAnalytics.tsx`)
   - Modal "Total Users" / "Total Vendors" showing `[object Object]`
   - Likely missing `JSON.parse` or showing raw response objects
   - Search for `JSON.stringify` or template literal rendering issues

4. **Admin settings enforcement**
   - `platform_settingsTable` exists but most pages don't read from it
   - Add a `usePlatformSettings()` hook + populate cache on app boot

5. **Social link visibility toggles** (admin dashboard)
   - Add admin page: which platforms (IG, FB, Twitter, TikTok) vendors can display

6. **Google OAuth set-password flow**
   - Add `POST /auth/set-password` (for users with no password_hash)
   - Frontend: add to Account.tsx when `!user.passwordHash`

7. **Auto-verify on payment** (admin-toggleable)
   - Webhook handler reads `platform_settings.auto_verify_on_payment`
   - If true, sets `vendor.verified=true` on subscription success

8. **Category display consistency**
   - Some places: `category.name`, others hardcoded
   - Standardize on `vendor.category.name` from API

9. **Charts use real values**
   - Verify each chart in `VendorAnalytics.tsx` + `AdminAnalytics.tsx` against `useApi` queries
   - Cross-check with DB counts

10. **Security hardening**
    - Add `helmet` middleware
    - CSRF token for state-changing operations
    - Stricter rate limits on `/auth/*` and `/payments/*`
    - Input sanitization on text fields (XSS prevention)

11. **UI color update**
    - Consider expanding brand palette: rose, amber, emerald accents
    - Smooth dark mode transitions

---

## 🧪 Testing

### Manual test accounts
| Role | Email | Password |
|------|-------|----------|
| Super Admin | `test@demo.com` | `testpass123` |
| Vendor | `vendor-test@demo.com` | `testpass123` |
| Customer | `e2e@demo.com` | `testpass123` |

### Quick health check
```bash
curl http://localhost:5000/api/healthz
# → {"success":true,"data":{"status":"ok",...,"services":{"database":"connected","redis":"fallback-memory"}}}
```

### Manual scripts
- `scripts/test-chat.mjs` — End-to-end chat flow via Socket.io
- `scripts/sql-proof.mjs` — Verify database state

---

## 📝 Coding Conventions

### TypeScript
- Strict mode is **off** (lots of `any`). Fix incrementally.
- `import type { ... }` for type-only imports
- No enums — use string literal unions (`role: "admin" | "vendor" | "customer"`)

### React
- Functional components only
- Hooks at top of file, after imports
- Use `useApi` for data fetching (NOT useEffect + fetch)
- Form state: react-hook-form + zod

### Backend
- Each module has `*.routes.ts`, `*.controller.ts`, `*.service.ts`
- Routes: thin (just middleware + controller call)
- Controllers: thin (validate, call service, format response)
- Services: business logic + DB calls
- Errors: throw `BadRequestError`, `NotFoundError`, etc. — caught by errorHandler

### Database
- Drizzle schema → generates types
- Always use `db.select()` (not raw queries)
- Foreign keys with `references()`
- Soft delete: `deletedAt: timestamp` column (when needed)

---

## 🔗 Quick Links

- **Live API**: http://localhost:5000
- **Live Frontend**: http://localhost:5173
- **API health**: http://localhost:5000/api/healthz
- **PG admin (Neon)**: https://console.neon.tech
- **Cloudinary**: https://console.cloudinary.com
- **Paystack**: https://dashboard.paystack.com
- **Resend**: https://resend.com/dashboard
