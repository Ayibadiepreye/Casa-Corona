
# Casa Corona — Deployment Guide

## Database Setup

The application requires a PostgreSQL database (tested with Neon).

### Option A: Fresh database
1. Create a Neon PostgreSQL project
2. Copy the connection string to `DATABASE_URL` in `apps/api/.env`
3. From repo root, run:
   ```bash
   pnpm install
   cd packages/db
   pnpm db:migrate    # applies all migrations
   pnpm db:seed       # inserts 10 categories + 8 platform_settings rows
   ```

### Option B: Existing database
If the database already has tables, you may need to drop them first:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```
Then run `db:migrate` and `db:seed`.

## Environment Variables

apps/api/.env must contain:
- DATABASE_URL (Postgres connection string)
- JWT_SECRET (min 32 chars)
- JWT_REFRESH_SECRET (min 32 chars)
- NODE_ENV (development|production|test)
- PORT (optional, default 5000)
- CORS_ORIGIN (frontend URL)

Optional (services gracefully degrade if missing):
- REDIS_URL
- RESEND_API_KEY, RESEND_FROM_EMAIL
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY, PAYSTACK_WEBHOOK_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
- VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
- SENTRY_DSN
- LOG_LEVEL

## Running Locally

```bash
# Install dependencies
pnpm install

# Start backend (port 3001)
pnpm --filter @casa-corona/api dev

# Start frontend (port 5173)
pnpm --filter @casa-corona/web dev

# Visit http://localhost:5173
```

## Admin Account

To create an admin user:
```sql
INSERT INTO users (email, password_hash, name, role, email_verified)
VALUES ('admin@casacorona.org', '&lt;bcrypt hash of password&gt;', 'Admin', 'admin', true);
```

Generate bcrypt hash:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('yourpassword', 10).then(h => console.log(h));"
```

## Platform Settings (Admin-Editable)

All business config lives in the `platform_settings` table:
- pricing (registration_fee: 45000 NGN, monthly_subscription: 7000 NGN, featured_slot: 25000 NGN)
- subscription (warning_days, grace_period_days, auto_renewal_default)
- chat (timeout_hours, max_message_length)
- features (enable_2fa, enable_push_notifications, enable_maintenance_mode)
- limits (max_portfolio_per_business: 50, max_services_per_business: 30)
- content (welcome_message, support_email)
- geo (default_latitude: 6.5244, default_longitude: 3.3792)
- cron (subscription_check schedule)

Admins edit these via Admin Dashboard → Settings panel.
