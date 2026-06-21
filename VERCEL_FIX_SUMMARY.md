# Vercel Configuration Fix ✅

## Problem
"Invalid vercel.json file provided" error when deploying to Vercel.

## Root Cause
Two conflicting `vercel.json` files:
1. Root `vercel.json` - Was trying to deploy both API and frontend
2. `apps/web/vercel.json` - Had invalid configuration

## Solution Applied

### ✅ Removed conflicting configuration files
- **Deleted:** Root `/vercel.json` (not needed since backend goes to Pxxl.app)
- **Deleted:** `/apps/web/vercel.json` (Vercel auto-handles Vite SPA routing)

### ✅ Created `.vercelignore`
- Added `/apps/web/.vercelignore` to exclude unnecessary files from deployment

### ✅ Remaining files
- `/apps/api/vercel.json` - Kept (doesn't affect frontend deployment)

---

## Vercel Project Configuration

### Required Settings in Vercel Dashboard:

1. **Framework Preset:** Vite
2. **Root Directory:** `apps/web`
3. **Build Command:** 
   ```bash
   cd ../.. && pnpm install && pnpm --filter @casa-corona/web build
   ```
4. **Output Directory:** `dist`
5. **Install Command:** `pnpm install`
6. **Node Version:** 18.x or 20.x

### Environment Variables (Vercel Dashboard):
```env
VITE_API_URL=https://your-backend.pxxl.app/api/v1
VITE_SOCKET_URL=https://your-backend.pxxl.app
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
```

---

## Why This Works

### For Vite + Vercel:
- ✅ Vercel **automatically detects** Vite framework
- ✅ Vercel **automatically handles** SPA client-side routing
- ✅ No `vercel.json` configuration needed for basic routing
- ✅ Build settings go in **Vercel dashboard**, not config files

### For Monorepo Setup:
- ✅ Root directory set to `apps/web`
- ✅ Build command navigates to root for workspace access
- ✅ `pnpm --filter` targets specific workspace package

---

## Deployment Steps (Updated)

### Option 1: Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**
2. Import your GitHub repository
3. Configure:
   - Framework: **Vite**
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && pnpm install && pnpm --filter @casa-corona/web build`
   - Output Directory: `dist`
4. Add environment variables
5. Click **Deploy**

### Option 2: Vercel CLI

```bash
# From project root
cd Casa-Corona-main

# Login to Vercel
vercel login

# Deploy
vercel --prod

# When prompted:
# - Root directory: apps/web
# - Build command: cd ../.. && pnpm install && pnpm --filter @casa-corona/web build
# - Output directory: dist
```

---

## ✅ Verification

After deployment, check:
- [ ] Deployment succeeds without "invalid vercel.json" error
- [ ] Frontend loads at Vercel URL
- [ ] Client-side routing works (e.g., `/browse`, `/vendor/slug`)
- [ ] API calls connect to Pxxl.app backend
- [ ] No 404 errors on page refresh

---

## Files Modified/Deleted

### Deleted:
- ❌ `/vercel.json` (root level - conflicted with monorepo setup)
- ❌ `/apps/web/vercel.json` (not needed for Vite)

### Created:
- ✅ `/apps/web/.vercelignore` (exclude unnecessary files)

### Kept:
- ✅ `/apps/api/vercel.json` (doesn't affect frontend, for reference only)

---

## Notes

- The backend (`apps/api`) is deployed to **Pxxl.app**, not Vercel
- Only the frontend (`apps/web`) is deployed to Vercel
- Vercel's automatic Vite detection handles everything
- No manual routing configuration needed

---

## Success! 🎉

Your Vercel deployment should now work without errors. The configuration is cleaner and follows Vercel's best practices for monorepo Vite projects.
