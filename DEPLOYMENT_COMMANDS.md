# Deployment Commands Reference

## 🔧 Backend (Pxxl.app / Render)

### ⚠️ IMPORTANT: Monorepo Build Configuration

**Root Directory:** `.` (project root, NOT `apps/api`)

### Configuration:
```
Root Directory:  . 
Build Command:   pnpm install && pnpm build
Start Command:   node apps/api/dist/index.js
Port:            5000 (or auto-detect)
Node Version:    18.x or 20.x
```

### Why build from root?
- The API depends on workspace packages (`@casa-corona/db`, `@casa-corona/api-zod`)
- These packages need to be built BEFORE the API
- `pnpm build` from root builds all packages in dependency order
- Building from `apps/api` alone will fail with "Output file has not been built" errors

### Alternative (if platform doesn't support root build):
```
Root Directory:  apps/api
Build Command:   cd ../.. && pnpm install && pnpm build && cd apps/api
Start Command:   node dist/index.js
Port:            5000
```

### Manual Testing Locally:
```bash
# Navigate to API directory
cd apps/api

# Install dependencies
pnpm install

# Build
pnpm build

# Start production server
pnpm start
# or
node dist/index.js
```

---

## 🌐 Frontend (Vercel)

### Configuration:
```
Framework:       Vite
Root Directory:  apps/web
Build Command:   cd ../.. && pnpm install && pnpm --filter @casa-corona/web build
Output Dir:      dist
Install Command: pnpm install
Node Version:    18.x or 20.x
```

### Manual Testing Locally:
```bash
# Navigate to web directory
cd apps/web

# Install dependencies
pnpm install

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## 📦 Database Migrations (After First Deploy)

### Run on Backend Server:
```bash
# From project root
pnpm --filter @casa-corona/db migrate:prod

# Or from database package
cd packages/db
pnpm migrate:prod
```

### Check Migration Status:
```bash
pnpm --filter @casa-corona/db migrate:status
```

---

## 🔍 Verification Commands

### Check Backend Build:
```bash
cd apps/api
pnpm build
ls dist/  # Should see index.js and other compiled files
```

### Check Frontend Build:
```bash
cd apps/web
pnpm build
ls dist/  # Should see index.html, assets/, etc.
```

### Test Production Locally:
```bash
# Backend (Terminal 1)
cd apps/api
NODE_ENV=production node dist/index.js

# Frontend (Terminal 2)
cd apps/web
pnpm preview
```

---

## 🐛 Troubleshooting

### Backend won't start:
```bash
# Check if dist folder exists
ls apps/api/dist/

# Rebuild
cd apps/api
rm -rf dist
pnpm build

# Check for errors
node dist/index.js
```

### Frontend build fails:
```bash
# Clear cache and rebuild
cd apps/web
rm -rf dist node_modules .turbo
pnpm install
pnpm build
```

### Database connection issues:
```bash
# Test database connection
cd packages/db
pnpm db:test

# Or create a simple test script
node -e "import('postgres').then(postgres => { const sql = postgres('your_database_url'); sql\`SELECT 1\`.then(console.log).catch(console.error); })"
```

---

## 📋 Pre-Deployment Checklist

### Backend:
- [ ] All environment variables set in Pxxl.app
- [ ] Database URL is correct (Neon with pooler)
- [ ] Redis URL is set (Upstash)
- [ ] JWT secrets are configured
- [ ] Paystack keys are set
- [ ] Cloudinary credentials are set
- [ ] `NODE_ENV=production`
- [ ] Build command: `pnpm install && pnpm build`
- [ ] Start command: `node dist/index.js`

### Frontend:
- [ ] Environment variables set in Vercel
- [ ] `VITE_API_URL` points to backend
- [ ] `VITE_SOCKET_URL` points to backend
- [ ] `VITE_PAYSTACK_PUBLIC_KEY` is set
- [ ] Root directory: `apps/web`
- [ ] Framework: Vite
- [ ] Build command includes workspace root access

### After Deployment:
- [ ] Backend is accessible via Pxxl.app URL
- [ ] Frontend is accessible via Vercel URL
- [ ] Update backend `FRONTEND_URL` with Vercel URL
- [ ] Update backend `CORS_ORIGIN` with Vercel URL
- [ ] Update frontend `VITE_API_URL` with Pxxl.app URL
- [ ] Redeploy both services after URL updates
- [ ] Run database migrations
- [ ] Test user registration
- [ ] Test login flow
- [ ] Test API endpoints
- [ ] Update Google OAuth URLs
- [ ] Set up Paystack webhook

---

## 🚀 Quick Deploy Commands

### From Scratch (Both Services):

```bash
# 1. Commit changes
git add .
git commit -m "Ready for production deployment"
git push origin main

# 2. Deploy Backend (Pxxl.app Dashboard)
# - Import from GitHub
# - Set root: apps/api
# - Build: pnpm install && pnpm build
# - Start: node dist/index.js
# - Add all environment variables from ENV_FOR_DEPLOYMENT.md

# 3. Deploy Frontend (Vercel Dashboard)
# - Import from GitHub
# - Framework: Vite
# - Root: apps/web
# - Build: cd ../.. && pnpm install && pnpm --filter @casa-corona/web build
# - Output: dist
# - Add 3 environment variables (VITE_*)

# 4. Update URLs and redeploy both
```

---

## 💡 Pro Tips

1. **Always deploy backend first** - Frontend needs backend URL
2. **Test locally with production builds** before deploying
3. **Keep test and live Paystack keys separate**
4. **Monitor logs** in both Pxxl.app and Vercel dashboards
5. **Set up error tracking** (Sentry) after basic deployment works
6. **Enable automatic deployments** from main branch
7. **Use environment variables** for all secrets (never commit them)
8. **Keep a backup** of your `.env` file securely

---

## 🆘 Common Issues

### "Module not found" errors:
- Ensure workspace dependencies are built: `pnpm build`
- Check `package.json` workspace references

### "Cannot connect to database":
- Verify `DATABASE_URL` is correct
- Ensure Neon database is active
- Check if IP is whitelisted (Neon allows all by default)

### "CORS errors" in browser:
- Update `CORS_ORIGIN` in backend to match frontend URL
- Ensure `FRONTEND_URL` is set correctly
- Check browser console for exact error

### "WebSocket connection failed":
- Verify `VITE_SOCKET_URL` doesn't end with `/api/v1`
- Check if Pxxl.app supports WebSockets
- Ensure Socket.IO is properly configured

---

## 📞 Support

If you encounter issues:
1. Check deployment logs in Pxxl.app/Vercel dashboards
2. Verify all environment variables are set
3. Test with `curl` commands to isolate frontend/backend issues
4. Check database connectivity
5. Review CORS and authentication settings
