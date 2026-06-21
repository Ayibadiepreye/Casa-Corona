# 🚀 Casa Corona Deployment Guide

## Architecture Overview

- **Frontend**: Vercel (React/Vite static site)
- **Backend**: Pxxl.app (Node.js/Express API)
- **Database**: Neon PostgreSQL
- **Images**: Cloudinary
- **Payments**: Paystack
- **Email**: Resend

---

## 📋 Pre-Deployment Checklist

### 1. Third-Party Service Setup

#### Neon (PostgreSQL Database)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy your connection string (starts with `postgresql://`)
4. Run migrations:
   ```bash
   psql YOUR_CONNECTION_STRING -f MIGRATION_newsletter.sql
   psql YOUR_CONNECTION_STRING -f MIGRATION_notifications_read_field.sql
   ```

#### Cloudinary (Image Storage)
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your credentials from Dashboard > Settings > Access Keys:
   - Cloud Name
   - API Key
   - API Secret

#### Paystack (Payment Processing)
1. Sign up at [paystack.com](https://paystack.com)
2. Go to Settings > API Keys & Webhooks
3. Copy your:
   - **Test Secret Key** (starts with `sk_test_`)
   - **Test Public Key** (starts with `pk_test_`)
   - **Live Secret Key** (starts with `sk_live_`) - for production
   - **Live Public Key** (starts with `pk_live_`) - for production
4. **IMPORTANT**: Set up webhook URL after backend deployment:
   - URL: `https://your-backend.pxxl.app/api/v1/payments/webhook`
   - Events: `charge.success`

#### Resend (Email Service)
1. Sign up at [resend.com](https://resend.com)
2. Add your domain and verify DNS records
3. Create an API key
4. Set your from email address

#### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - Development: `http://localhost:5000/api/v1/auth/google/callback`
     - Production: `https://your-backend.pxxl.app/api/v1/auth/google/callback`
5. Copy Client ID and Client Secret

---

## 🔧 Backend Deployment (Pxxl.app)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

### Step 2: Deploy on Pxxl.app

1. Go to [pxxl.app](https://pxxl.app)
2. Sign up / Log in
3. Click **"New Project"**
4. Connect your GitHub repository
5. Select the `Casa-Corona` repository
6. Configure build settings:
   - **Root Directory**: `apps/api`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `node dist/index.js`
   - **Port**: `5000` (or auto-detect)

### Step 3: Set Environment Variables

Add these environment variables in Pxxl.app dashboard:

```env
# App Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app

# Database
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Redis (Optional - will use in-memory fallback if not provided)
REDIS_URL=redis://your-redis-url:6379

# JWT Secrets (Generate strong random strings)
JWT_SECRET=your-very-long-random-secret-min-32-characters
JWT_REFRESH_SECRET=your-very-long-random-refresh-secret-min-32-characters
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Paystack (Use TEST keys for testing, LIVE for production)
PAYSTACK_SECRET_KEY=sk_live_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_from_paystack

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Resend)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_SUPPORT_EMAIL=support@yourdomain.com

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://your-backend.pxxl.app/api/v1/auth/google/callback

# VAPID Keys for Push Notifications (Generate with web-push)
# Run: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:support@yourdomain.com

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cron Jobs
ENABLE_CRON_JOBS=true
CRON_SECRET=your-random-cron-secret-for-webhook-security

# Maintenance
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE=We're performing maintenance. Back soon!
SUPPORT_EMAIL=support@yourdomain.com
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Copy your backend URL (e.g., `https://casa-corona-api.pxxl.app`)

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Sign up / Log in with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### Step 2: Set Environment Variables

Add this in Vercel dashboard (Settings > Environment Variables):

```env
VITE_API_URL=https://your-backend.pxxl.app/api/v1
VITE_SOCKET_URL=https://your-backend.pxxl.app
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here
```

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Copy your frontend URL (e.g., `https://casa-corona.vercel.app`)

### Step 4: Update Backend CORS

Go back to Pxxl.app and update these environment variables:

```env
FRONTEND_URL=https://casa-corona.vercel.app
CORS_ORIGIN=https://casa-corona.vercel.app
```

Redeploy backend for changes to take effect.

---

## 🔐 Post-Deployment Configuration

### 1. Update Paystack Webhook

1. Go to Paystack Dashboard > Settings > API Keys & Webhooks
2. Add webhook URL: `https://your-backend.pxxl.app/api/v1/payments/webhook`
3. Copy the webhook secret and add to backend env:
   ```env
   PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
   ```

### 2. Update Google OAuth Redirect URIs

1. Go to Google Cloud Console
2. OAuth 2.0 Client > Edit
3. Add to Authorized redirect URIs:
   ```
   https://your-backend.pxxl.app/api/v1/auth/google/callback
   ```

### 3. Configure Custom Domain (Optional)

#### For Frontend (Vercel):
1. Go to Project Settings > Domains
2. Add your domain (e.g., `casacorona.com`)
3. Configure DNS records as instructed

#### For Backend (Pxxl.app):
1. Check Pxxl.app documentation for custom domain setup
2. Update `FRONTEND_URL` and `CORS_ORIGIN` accordingly

### 4. Set Up SSL/HTTPS

Both Vercel and Pxxl.app provide automatic SSL certificates. Ensure:
- All environment URLs use `https://`
- Cookie `secure` flag is enabled in production
- CORS is properly configured

---

## ✅ Verification Checklist

After deployment, test these features:

### Authentication
- [ ] User registration works
- [ ] Email verification sends
- [ ] Login works
- [ ] Google OAuth works (if enabled)
- [ ] JWT tokens are issued correctly

### Payments
- [ ] Subscription payment initializes
- [ ] Featured listing payment initializes
- [ ] Webhook receives events
- [ ] Payment verification works
- [ ] Commission invoices display

### Core Features
- [ ] Image uploads work (Cloudinary)
- [ ] Bookings can be created
- [ ] Real-time chat works (Socket.io)
- [ ] Notifications send
- [ ] Email notifications send
- [ ] Newsletter subscription works

### Admin Features
- [ ] Admin dashboard loads
- [ ] Analytics display correctly
- [ ] Announcements send
- [ ] Commission tracking works

---

## 🐛 Troubleshooting

### CORS Errors
```
Error: CORS policy blocked
```
**Solution**: Ensure `CORS_ORIGIN` in backend matches your frontend URL exactly (no trailing slash)

### Database Connection Errors
```
Error: Connection timeout
```
**Solution**: 
- Verify `DATABASE_URL` is correct
- Ensure Neon database is active
- Check SSL mode: `?sslmode=require`

### Paystack Webhook Not Working
```
Webhook signature invalid
```
**Solution**:
- Verify `PAYSTACK_WEBHOOK_SECRET` matches Paystack dashboard
- Check webhook URL is accessible
- Ensure no trailing slash in webhook URL

### Image Upload Fails
```
Cloudinary upload error
```
**Solution**:
- Verify all Cloudinary credentials are correct
- Check cloud name doesn't have spaces
- Ensure API key and secret are active

### Redis Connection Issues
```
Redis connection failed
```
**Solution**: 
- This is non-critical - app will fallback to in-memory storage
- Add `REDIS_URL` if you need Redis features
- Otherwise, you can omit this variable

---

## 🔄 Updating Your Deployment

### Backend Updates
1. Push changes to GitHub
2. Pxxl.app will auto-deploy (if enabled)
3. Or manually trigger deploy in Pxxl.app dashboard

### Frontend Updates
1. Push changes to GitHub
2. Vercel will auto-deploy
3. Or manually trigger deploy in Vercel dashboard

### Database Migrations
```bash
# Connect to production database
psql $DATABASE_URL -f your-migration.sql
```

---

## 📊 Monitoring

### Backend Logs
- View logs in Pxxl.app dashboard
- Check for errors in startup and runtime

### Frontend Errors
- Check Vercel deployment logs
- Use browser console for runtime errors

### Database Monitoring
- Monitor Neon dashboard for connection issues
- Check query performance

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong JWT secrets** - Min 32 characters, random
3. **Enable HTTPS only** - Both platforms provide this
4. **Rotate secrets periodically** - Especially JWT and Paystack keys
5. **Use Paystack LIVE keys only in production** - Test with TEST keys first
6. **Set up monitoring** - Track errors and performance
7. **Backup database regularly** - Use Neon's backup features

---

## 💰 Costs Estimate

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| Pxxl.app | Unlimited free hosting | - |
| Vercel | 100 GB bandwidth/month | $20/month Pro |
| Neon | 512 MB storage, 0.5 GB data | $19/month |
| Cloudinary | 25GB storage, 25GB bandwidth | $99/month |
| Resend | 100 emails/day | $20/month for 50k |
| Paystack | Free (transaction fees only) | 1.5% + ₦100 per transaction |

**Estimated starting cost**: ~$0-20/month (using free tiers)

---

## 📞 Support

- **Pxxl.app**: Contact via their platform
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Neon**: [neon.tech/docs](https://neon.tech/docs)
- **Paystack**: support@paystack.com
- **General Issues**: Check logs first, then GitHub issues

---

## ✅ Deployment Complete!

Once everything is verified:
1. Update your custom domain
2. Monitor for 24 hours
3. Test all critical flows
4. Announce to users 🎉

**Your Casa Corona platform is now live!** 🚀
