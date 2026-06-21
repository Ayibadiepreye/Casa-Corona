# 🚀 QUICK DEPLOYMENT REFERENCE

## Backend (Pxxl.app) Environment Variables
```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app
DATABASE_URL=postgresql://...neon.tech.../casacorona?sslmode=require
JWT_SECRET=<32+ char random string>
JWT_REFRESH_SECRET=<32+ char random string>
PAYSTACK_SECRET_KEY=sk_live_<your-key>
PAYSTACK_PUBLIC_KEY=pk_live_<your-key>
PAYSTACK_WEBHOOK_SECRET=<from paystack dashboard>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
RESEND_API_KEY=re_<your-api-key>
RESEND_FROM_EMAIL=noreply@yourdomain.com
CORS_ORIGIN=https://your-frontend.vercel.app
CORS_CREDENTIALS=true
ENABLE_CRON_JOBS=true
```

## Frontend (Vercel) Environment Variables
```
VITE_API_URL=https://your-backend.pxxl.app/api/v1
VITE_SOCKET_URL=https://your-backend.pxxl.app
VITE_PAYSTACK_PUBLIC_KEY=pk_live_<your-key>
```

## Things to Update After Deployment

### 1. Paystack Webhook URL
Dashboard > Settings > Webhooks
URL: `https://your-backend.pxxl.app/api/v1/payments/webhook`

### 2. Google OAuth Redirect URI (if using)
Google Console > Credentials > OAuth 2.0
Add: `https://your-backend.pxxl.app/api/v1/auth/google/callback`

### 3. Cloudinary CORS (if needed)
Cloudinary Console > Settings > Security
Add allowed domains

### 4. Update Backend CORS After Frontend Deploy
Add frontend URL to CORS_ORIGIN environment variable

## Build Commands

### Backend (Pxxl.app)
- Build: `pnpm install && pnpm build`
- Start: `node dist/index.js`
- Root: `apps/api`

### Frontend (Vercel)
- Build: `pnpm install && pnpm build`
- Output: `dist`
- Root: `apps/web`

## Database Migrations
```bash
psql $DATABASE_URL -f MIGRATION_newsletter.sql
psql $DATABASE_URL -f MIGRATION_notifications_read_field.sql
```

## Testing Checklist
- [ ] Frontend loads
- [ ] Backend health check: `https://your-backend.pxxl.app/healthz`
- [ ] Login works
- [ ] Image upload works
- [ ] Payment initialization works
- [ ] Webhook receives events
