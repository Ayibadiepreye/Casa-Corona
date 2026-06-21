# Vercel Deployment Setup for Casa Corona

## ✅ Fixed: No vercel.json Needed!

For Vite applications in a monorepo, **Vercel automatically handles SPA routing**. 

The `vercel.json` files have been removed because:
- ✅ Vercel auto-detects Vite framework
- ✅ Vercel automatically handles client-side routing
- ✅ Configuration is done in Vercel dashboard, not vercel.json

---

## 📦 Vercel Project Settings

Configure these settings in the Vercel dashboard (not in vercel.json):

### 1. Framework Preset
- Select: **Vite**

### 2. Root Directory
- Set to: `apps/web`

### 3. Build & Development Settings

**Build Command:**
```bash
cd ../.. && pnpm install && pnpm --filter @casa-corona/web build
```

**Output Directory:**
```
dist
```

**Install Command:**
```bash
pnpm install
```

### 4. Node.js Version
- Version: **18.x** or higher (recommended: 20.x)

---

## 🔐 Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
VITE_API_URL=https://your-backend.pxxl.app/api/v1
VITE_SOCKET_URL=https://your-backend.pxxl.app
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
```

**Important:** Make sure to add these for **Production** environment.

---

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository: `Casa-Corona`
4. Configure settings:
   - Framework: **Vite**
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && pnpm install && pnpm --filter @casa-corona/web build`
   - Output Directory: `dist`
5. Add environment variables (see above)
6. Click **"Deploy"**

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project root
cd Casa-Corona-main

# Deploy
vercel --prod
```

When prompted:
- Set up and deploy: **Yes**
- Which scope: Choose your account
- Link to existing project: **No** (first time)
- What's your project's name: `casa-corona`
- In which directory is your code located: `apps/web`
- Want to override settings: **Yes**
- Build Command: `cd ../.. && pnpm install && pnpm --filter @casa-corona/web build`
- Output Directory: `dist`
- Development Command: Leave default

---

## 🔍 Troubleshooting

### Error: "Invalid vercel.json file provided"
**Solution:** The vercel.json has been fixed. Only use it for rewrites/routing config. Put build settings in Vercel dashboard.

### Error: "pnpm-lock.yaml not found"
**Solution:** The lockfile exists in the root directory. Make sure your build command starts with `cd ../..` to access it.

### Error: "Module not found"
**Solution:** The build command should install dependencies from the root:
```bash
cd ../.. && pnpm install && pnpm --filter @casa-corona/web build
```

### Build succeeds but app shows blank page
**Solution:** Check that environment variables are set correctly. The app needs `VITE_API_URL` to connect to the backend.

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads at your Vercel URL
- [ ] Home page displays correctly
- [ ] Can browse vendors
- [ ] API calls work (check Network tab in DevTools)
- [ ] Environment variables are set
- [ ] CORS is configured on backend (FRONTEND_URL)

---

## 🔄 Automatic Deployments

Once set up, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Run builds and notify you of failures

---

## 📝 Notes

- The `vercel.json` file only handles SPA routing rewrites
- Build configuration goes in Vercel dashboard settings
- This is a **monorepo** setup using pnpm workspaces
- Build must run from project root to access shared packages

---

## 🆘 Need Help?

If deployment fails:
1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Ensure backend is deployed and accessible
4. Test locally with production build:
   ```bash
   cd apps/web
   pnpm build
   pnpm preview
   ```
