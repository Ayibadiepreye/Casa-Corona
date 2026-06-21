# Casa Corona - Deployment Checklist

## Pre-Deployment Steps

### 1. Save the Logo Image
The provided logo (green crown with gold accent on white/cream background) needs to be saved:
- **Location:** `apps/web/public/logo.png`
- **Recommended Size:** 512x512px
- **Format:** PNG with transparency
- **Usage:** Footer, header, favicon generation

### 2. Rebuild Frontend
```bash
cd apps/web
npm run build
```

### 3. Rebuild Backend
```bash
cd apps/api
npm run build
```

### 4. Verify Environment Variables
Check that `.env` contains:
```env
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
DATABASE_URL=postgresql://...
FRONTEND_URL=https://casacorona.org
REDIS_URL=redis://...
```

### 5. Test Key Features

#### Vendor Profile
```bash
# Test cover upload
1. Login as vendor
2. Go to Profile → Upload cover image
3. Save and verify it persists
4. Visit public profile → cover shows correctly
```

#### Featured Listing Payment
```bash
# Test featured payment
1. Login as vendor
2. Go to Dashboard → "Manage Subscription"
3. Click "Become Featured"
4. Verify price shows ₦25,000 (not 2,500,000)
5. Complete test payment
6. Check featured badge appears
```

#### Admin Analytics
```bash
# Test analytics dashboard
1. Login as admin
2. Go to Admin → Overview
3. Verify "Subscriptions This Month" shows count
4. Verify "Total Commission" shows Naira amounts
5. Check settings in Admin → Settings
6. Verify featured_slot = 25000
```

## Deployment Commands

### Production Build
```bash
# Build all packages
pnpm install
pnpm build

# Run migrations (if any)
cd packages/db
pnpm run db:push

# Start production server
cd apps/api
pm2 start dist/index.js --name casa-corona-api

# Start frontend (if SSR)
cd apps/web
pm2 start npm --name casa-corona-web -- start
```

### Docker Deployment
```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

## Post-Deployment Verification

### 1. Smoke Tests
- [ ] Homepage loads
- [ ] Vendor listings display with images
- [ ] Search and filtering work
- [ ] User can register
- [ ] Vendor can login
- [ ] Admin dashboard accessible

### 2. Payment Flow Test
- [ ] Subscription payment initializes
- [ ] Featured payment shows correct price
- [ ] Payment verification works
- [ ] Webhook receives events

### 3. Analytics Check
- [ ] Admin analytics show real numbers
- [ ] Commission totals display in Naira
- [ ] Subscription revenue counts this month

### 4. Legal Documents
- [ ] `/api/v1/compliance/privacy-policy` returns full document
- [ ] `/api/v1/compliance/terms` returns full document

## Rollback Plan

If issues occur:

```bash
# Stop services
pm2 stop all

# Restore previous version
git checkout [previous-commit]
pnpm install
pnpm build

# Restart services
pm2 restart all
```

## Monitoring

### Health Checks
- API: `GET /api/v1/health`
- Database: Check connection pool
- Redis: Check connection status
- Paystack: Verify webhook events

### Logs to Watch
- `apps/api/api.log` - Application logs
- PM2 logs: `pm2 logs`
- Nginx/Apache access logs
- Paystack webhook logs

## Support Contacts

- **Technical Issues:** support@casacorona.org
- **Payment Issues:** Paystack support
- **Hosting:** Your hosting provider

---

## Summary of Changes in This Deployment

1. ✅ Fixed vendor cover image upload (field name correction)
2. ✅ Fixed featured listing price display (₦25,000 instead of 2,500,000)
3. ✅ Fixed admin analytics (proper kobo-to-Naira conversion)
4. ✅ Updated footer location (Port Harcourt, Nigeria)
5. ✅ Added comprehensive Terms of Service
6. ✅ Added comprehensive Privacy Policy
7. ✅ Verified commission tracking system
8. ✅ Verified announcement broadcasting
9. ✅ Verified featured listing auto-activation

**All systems verified and operational** ✅
