# Casa Corona — Deployment Guide

## Architecture
- **Frontend** → Vercel (Vite + React, `apps/web`)
- **Backend** → Render (Node + Express + Socket.io, `apps/api`)
- **Database** → Neon Postgres (managed, connection-pooled)
- **Redis** → Upstash (or Render Key-Value, free tier)
- **Storage** → Cloudinary (CDN for images)
- **Email** → Resend

---

## 1. Frontend → Vercel

### One-time setup
1. Go to https://vercel.com → "Add New Project" → import this repo
2. **Root Directory**: `apps/web`
3. Vercel will detect Vite automatically (it'll read `vercel.json`)
4. **Environment Variables** (Project Settings → Environment Variables):
   - `VITE_API_URL` = `https://casa-corona-api.onrender.com/api/v1`
5. Deploy

### Custom domain
- Add domain in Vercel → Domains
- Set DNS: CNAME `www` → `cname.vercel-dns.com`, A `@` → `76.76.21.21`

### Important notes
- `vercel.json` has SPA rewrite to `/index.html` so client routing works on refresh
- Service worker (`sw.js`) served from root with `Service-Worker-Allowed: /`
- HTTPS only (Vercel auto-provisions)

---

## 2. Backend → Render

### One-time setup
1. Go to https://render.com → "New" → "Blueprint"
2. Point to this repo (Render reads `render.yaml`)
3. **Set the env vars** that are `sync: false`:
   - `DATABASE_URL` + `DIRECT_URL` (from Neon dashboard)
   - `REDIS_URL` (from Upstash, optional)
   - `CORS_ORIGIN` = `https://your-frontend.vercel.app` (NO trailing slash)
   - `JWT_SECRET` + `JWT_REFRESH_SECRET` (generate with `openssl rand -hex 32`)
   - `PAYSTACK_SECRET_KEY` (live key from Paystack dashboard)
   - `RESEND_API_KEY` + `EMAIL_FROM`
   - `CLOUDINARY_*` (3 vars)
   - `GOOGLE_*` (3 vars, with `GOOGLE_REDIRECT_URI` = `https://api.casacorona.org/api/v1/auth/google/callback`)
   - `VAPID_*` (already generated; copy from local `.env`)
   - `SUPPORT_EMAIL`
4. Click "Apply"

### Health check
Render pings `/api/healthz` every 30s — make sure it returns `{success:true}`.

### Custom domain
- Settings → Custom Domains → add `api.casacorona.org`
- Set DNS: CNAME `api` → `<your-service>.onrender.com`

---

## 3. Database → Neon

### One-time setup
1. https://console.neon.tech → Create project "casa-corona-prod"
2. Region: `us-east-2` (matches Render's Oregon-free tier via private networking, or just use the auto-region)
3. Copy **pooled** connection string → `DATABASE_URL`
4. Copy **direct** connection string → `DIRECT_URL`
5. From your local machine, run migrations against prod:
   ```bash
   cd packages/db
   DATABASE_URL='postgresql://...' DIRECT_URL='postgresql://...' pnpm drizzle-kit push
   ```
   Or use `drizzle-kit migrate` for safer, versioned migrations.

---

## 4. Webhooks → Paystack

After deploying, register the webhook URL in Paystack Dashboard:
- **Webhook URL**: `https://api.casacorona.org/api/v1/payments/webhook`
- Events: `charge.success`, `subscription.create`, `subscription.disable`

---

## 5. OAuth → Google

In Google Cloud Console:
- Authorized redirect URI: `https://api.casacorona.org/api/v1/auth/google/callback`

---

## 6. Post-deploy verification

Run these curls against the prod API:

```bash
# Health
curl https://api.casacorona.org/api/healthz
# → {"success":true,"data":{"status":"ok",...}}

# Public browse
curl https://api.casacorona.org/api/v1/vendors
# → 200 with vendor list

# Login as admin
curl -X POST https://api.casacorona.org/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://casacorona.org" \
  -d '{"email":"admin@casacorona.org","password":"..."}'

# Cron logs (Render Dashboard → Logs)
# Should see:
#   [message-cleanup] Cron started (hourly)
#   [sub-cron] Subscription cron started (hourly)
```

---

## 7. Maintenance mode toggle

To take the platform offline for updates:
1. Render dashboard → casa-corona-api → Environment
2. Set `MAINTENANCE_MODE = "true"`, save
3. Render auto-redeploys
4. All non-admin routes return 503 with friendly message
5. To restore: set back to `"false"`

---

## 8. Cost summary (free/low tiers)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | $0 |
| Render Web | Starter | $7/mo (or free with cold starts) |
| Neon Postgres | Free (0.5GB) | $0 |
| Upstash Redis | Free (10k cmds/day) | $0 |
| Cloudinary | Free (25 credits) | $0 |
| Resend | Free (3k emails/mo) | $0 |
| Paystack | Free (only % per txn) | % based |
| **Total** | | **~$7/mo** |
