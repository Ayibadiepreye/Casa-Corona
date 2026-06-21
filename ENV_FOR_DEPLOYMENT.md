# Environment Variables for Deployment

## 🌐 FRONTEND (Vercel) - Copy & Paste These 3 Variables

```env
VITE_API_URL=https://your-backend-url.pxxl.app/api/v1
VITE_SOCKET_URL=https://your-backend-url.pxxl.app
VITE_PAYSTACK_PUBLIC_KEY=pk_test_efd6d41cf4235bda29f127f75ec1f261ffc6b116
```

**Instructions:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable for **Production** environment
3. Replace `your-backend-url.pxxl.app` with your actual Pxxl.app URL after deploying backend

---

## 🔧 BACKEND (Pxxl.app) - Copy & Paste All Variables Below

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-url.vercel.app

DATABASE_URL=postgresql://neondb_owner:npg_AFOXqT85QJdW@ep-long-dew-aikmkda6-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

REDIS_URL=rediss://default:gQAAAAAAAk2KAAIgcDJjMDcwNDkxNTlhNTI0MjVkYjMzOGUxNDNjNjhkODE4Yg@usable-snapper-150922.upstash.io:6379

JWT_SECRET=casa-corona-super-secret-jwt-key-2026-dev-only
JWT_REFRESH_SECRET=casa-corona-super-secret-refresh-key-2026-dev-only

CLOUDINARY_CLOUD_NAME=dfcsermnf
CLOUDINARY_API_KEY=284247881777144
CLOUDINARY_API_SECRET=w7Pc5l0KszAHQAnHnml6Dpd1EMk

PAYSTACK_SECRET_KEY=sk_test_b1307f368587fd0b030fea3915072fe9fdfabdf5
PAYSTACK_PUBLIC_KEY=pk_test_efd6d41cf4235bda29f127f75ec1f261ffc6b116
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
PAYSTACK_BASE_URL=https://api.paystack.co

RESEND_API_KEY=re_K7UwMY6d_N6qcb9TK4NjRHwvEx3qtKaQF
RESEND_FROM_EMAIL=Casa Corona <noreply@casacorona.org>
RESEND_SUPPORT_EMAIL=support@casacorona.org

VAPID_PUBLIC_KEY=BKwVZB2IaxfQY9iMsupIsXSD7gn77STy5PzIKPtUn7BNjJw1uKBIaOeuVmv532PdVkipn1VFUmWw0QjVCF7EBtM
VAPID_PRIVATE_KEY=UMQas8_rnbVmyB0CS9riALD1bAXM0YCz2-G-3gPghr8
VAPID_SUBJECT=mailto:admin@casacorona.org

GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL=https://your-backend-url.pxxl.app/api/v1/auth/google/callback

SESSION_SECRET=casa-corona-super-secret-session-key-2026-dev-only

# CORS - IMPORTANT: Add ALL your frontend URLs (comma-separated, no spaces)
# Include www and non-www versions, plus Vercel preview URLs if needed
CORS_ORIGIN=https://www.casacorona.org,https://casacorona.org,https://casa-corona.vercel.app
CORS_CREDENTIALS=true

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

MAX_FILE_SIZE_MB=10
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
ALLOWED_DOCUMENT_TYPES=application/pdf,image/jpeg,image/png

ENABLE_2FA=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_CAPTCHA=false
ENABLE_EMAIL_VERIFICATION=true
ENABLE_MAINTENANCE_MODE=false

REGISTRATION_FEE=5000000
MONTHLY_SUBSCRIPTION_FEE=1000000
FEATURED_FEE=2500000
BULK_3_DISCOUNT=5
BULK_6_DISCOUNT=10
BULK_12_DISCOUNT=20

COMMISSION_TYPE=percentage
COMMISSION_VALUE=5

CHAT_TIMEOUT_HOURS=24
CHAT_EXPORT_RETENTION_DAYS=7
MAX_MESSAGE_LENGTH=5000

SUBSCRIPTION_WARNING_DAYS=5,2,1
GRACE_PERIOD_DAYS=7
AUTO_RENEWAL_DEFAULT=false

MAX_PORTFOLIO_PER_BUSINESS=50
MAX_SERVICES_PER_BUSINESS=30
MAX_PRODUCTS_PER_BUSINESS=50
MAX_REVIEW_PHOTOS=5
MAX_REVIEW_LENGTH=1000
MAX_BUSINESS_DESC_LENGTH=2000

LOG_LEVEL=info

BCRYPT_SALT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION_MINUTES=30

ENABLE_CRON_JOBS=true
CRON_SUBSCRIPTION_CHECK=0 9 * * *
CRON_CHAT_CLEANUP=0 0 * * *
CRON_ANALYTICS_AGGREGATE=0 1 * * *

DEFAULT_LATITUDE=6.5244
DEFAULT_LONGITUDE=3.3792
MAX_SEARCH_RADIUS_KM=50

SENTRY_DSN=
SENTRY_ENVIRONMENT=production
```

**Instructions:**
1. Go to Pxxl.app Dashboard → Your Project → Environment Variables
2. Copy the entire block above
3. Paste into Pxxl.app environment variables section
4. After deploying, update these placeholders:
   - Replace `your-backend-url.pxxl.app` with your actual Pxxl.app URL
   - Replace `your-frontend-url.vercel.app` with your actual Vercel URL
5. **Important:** After updating URLs, redeploy both services

---

## 📋 Deployment Order

### Step 1: Deploy Backend First

**⚠️ IMPORTANT: Configure these settings EXACTLY:**

```
Root Directory:  .
Build Command:   pnpm install && pnpm build
Start Command:   node apps/api/dist/index.js
Port:            5000
Node Version:    20.x
```

**Why root directory (`.`)?**
- The API depends on workspace packages (`@casa-corona/db`)
- Building from `apps/api` will fail with "Output file has not been built" errors
- Building from root (`.`) builds all packages in correct order

**Steps:**
1. Copy backend environment variables to Render/Pxxl.app
2. Set root directory to `.` (not `apps/api`)
3. Deploy to Render/Pxxl.app
4. Get your backend URL (e.g., `casa-corona-api.onrender.com`)

### Step 2: Update & Deploy Frontend
1. Copy frontend environment variables to Vercel
2. Replace `your-backend-url.pxxl.app` with actual Pxxl.app URL
3. Deploy to Vercel
4. Get your frontend URL (e.g., `casa-corona.vercel.app`)

### Step 3: Update Backend URLs
1. Go back to Render environment variables
2. Update these variables with your actual frontend URLs:
   - `FRONTEND_URL=https://www.casacorona.org`
   - `CORS_ORIGIN=https://www.casacorona.org,https://casacorona.org,https://casa-corona.vercel.app`
   - `GOOGLE_CALLBACK_URL=https://casa-corona.onrender.com/api/v1/auth/google/callback`
3. **Redeploy backend** - Render will automatically redeploy when you save environment changes

---

## ⚠️ IMPORTANT NOTES

### Security - Before Going Live:
1. **Change JWT Secrets** - Generate new secure secrets for production
2. **Update Google OAuth** - Add production URLs to Google Console
3. **Switch Paystack** - Change from test keys to live keys:
   - `PAYSTACK_SECRET_KEY=sk_live_...`
   - `PAYSTACK_PUBLIC_KEY=pk_live_...`
4. **Set Paystack Webhook** - Configure webhook URL in Paystack dashboard:
   - URL: `https://your-backend.pxxl.app/api/v1/payments/webhook`
   - Get webhook secret from Paystack and update `PAYSTACK_WEBHOOK_SECRET`

### Database:
- ✅ Neon PostgreSQL is already configured
- ✅ Connection string uses pooler for better performance
- Run migrations after first deployment:
  ```bash
  pnpm --filter @casa-corona/db migrate:prod
  ```

### Google OAuth URLs to Update in Console:
- **Authorized JavaScript origins:**
  - `https://your-frontend-url.vercel.app`
  - `https://your-backend-url.pxxl.app`
- **Authorized redirect URIs:**
  - `https://your-backend-url.pxxl.app/api/v1/auth/google/callback`

### Paystack Test vs Live:
**Currently using TEST keys:**
- Transactions won't charge real money
- Use test card: `4084084084084081` (any future expiry, any CVV)

**To go live:**
1. Complete Paystack KYC verification
2. Get live API keys from Paystack dashboard
3. Replace `sk_test_` with `sk_live_` keys
4. Replace `pk_test_` with `pk_live_` keys

---

## 🔍 Environment Variable Checklist

### After Deployment, Verify:

#### Frontend (Vercel):
- [ ] `VITE_API_URL` points to Pxxl.app backend
- [ ] `VITE_SOCKET_URL` points to Pxxl.app backend (no `/api/v1`)
- [ ] `VITE_PAYSTACK_PUBLIC_KEY` is set

#### Backend (Pxxl.app):
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` points to Vercel frontend
- [ ] `CORS_ORIGIN` points to Vercel frontend
- [ ] `DATABASE_URL` is set (Neon)
- [ ] `REDIS_URL` is set (Upstash)
- [ ] All Cloudinary keys are set
- [ ] All Paystack keys are set
- [ ] Resend API key is set
- [ ] JWT secrets are set
- [ ] Google OAuth callback URL updated

---

## 🚀 Quick Copy Commands

### Copy Backend Variables (Linux/Mac):
```bash
cat ENV_FOR_DEPLOYMENT.md | grep -A 200 "BACKEND (Pxxl.app)" | grep "^[A-Z]" | pbcopy
```

### Copy Frontend Variables (Linux/Mac):
```bash
cat ENV_FOR_DEPLOYMENT.md | grep -A 5 "FRONTEND (Vercel)" | grep "^VITE_" | pbcopy
```

### Windows (PowerShell):
```powershell
# Copy backend section manually from this file
# Or use Pxxl.app's bulk import feature if available
```
