import "dotenv/config";
import { z } from "zod";

// Helper: parse comma-separated string to number array
const csvInts = z.string().optional().transform((v) => {
  if (!v) return undefined;
  return v.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n));
});

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  API_URL: z.string().optional(),
  FRONTEND_URL: z.string().default("http://localhost:5173"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Redis
  REDIS_URL: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Paystack
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
  PAYSTACK_BASE_URL: z.string().default("https://api.paystack.co"),

  // Resend
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  RESEND_SUPPORT_EMAIL: z.string().optional(),

  // VAPID
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // Maintenance mode
  MAINTENANCE_MODE: z.string().optional().transform((v) => v === "true"),
  MAINTENANCE_MESSAGE: z.string().optional(),
  SUPPORT_EMAIL: z.string().optional(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  // Session
  SESSION_SECRET: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  CORS_CREDENTIALS: z.string().optional().transform((v) => v === "true" || v === "1"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // File upload
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  ALLOWED_IMAGE_TYPES: z.string().default("image/jpeg,image/png,image/webp,image/gif"),
  ALLOWED_DOCUMENT_TYPES: z.string().default("application/pdf,image/jpeg,image/png"),
  UPLOAD_DIR: z.string().optional(),

  // Feature flags
  ENABLE_2FA: z.string().optional().transform((v) => v === "true"),
  ENABLE_PUSH_NOTIFICATIONS: z.string().optional().transform((v) => v === "true"),
  ENABLE_CAPTCHA: z.string().optional().transform((v) => v === "true"),
  ENABLE_EMAIL_VERIFICATION: z.string().optional().transform((v) => v === "true"),
  ENABLE_MAINTENANCE_MODE: z.string().optional().transform((v) => v === "true"),

  // Pricing (kobo)
  REGISTRATION_FEE: z.coerce.number().default(5000000),
  MONTHLY_SUBSCRIPTION_FEE: z.coerce.number().default(1000000),
  FEATURED_FEE: z.coerce.number().default(2500000),
  BULK_3_DISCOUNT: z.coerce.number().default(5),
  BULK_6_DISCOUNT: z.coerce.number().default(10),
  BULK_12_DISCOUNT: z.coerce.number().default(20),

  // Commission
  COMMISSION_TYPE: z.string().default("percentage"),
  COMMISSION_VALUE: z.coerce.number().default(5),

  // Chat
  CHAT_TIMEOUT_HOURS: z.coerce.number().default(24),
  CHAT_EXPORT_RETENTION_DAYS: z.coerce.number().default(7),
  MAX_MESSAGE_LENGTH: z.coerce.number().default(5000),

  // Subscription
  SUBSCRIPTION_WARNING_DAYS: csvInts,
  GRACE_PERIOD_DAYS: z.coerce.number().default(7),
  AUTO_RENEWAL_DEFAULT: z.string().optional().transform((v) => v === "true"),

  // Limits
  MAX_PORTFOLIO_PER_BUSINESS: z.coerce.number().default(50),
  MAX_SERVICES_PER_BUSINESS: z.coerce.number().default(30),
  MAX_PRODUCTS_PER_BUSINESS: z.coerce.number().default(50),
  MAX_REVIEW_PHOTOS: z.coerce.number().default(5),
  MAX_REVIEW_LENGTH: z.coerce.number().default(1000),
  MAX_BUSINESS_DESC_LENGTH: z.coerce.number().default(2000),

  // Logging
  LOG_LEVEL: z.string().default("info"),
  LOG_FILE: z.string().optional(),

  // Security
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().default(5),
  LOGIN_LOCKOUT_DURATION_MINUTES: z.coerce.number().default(30),

  // Cron
  ENABLE_CRON_JOBS: z.string().optional().transform((v) => v === "true"),
  CRON_SUBSCRIPTION_CHECK: z.string().default("0 9 * * *"),
  CRON_CHAT_CLEANUP: z.string().default("0 0 * * *"),
  CRON_ANALYTICS_AGGREGATE: z.string().default("0 1 * * *"),
  CRON_SECRET: z.string().optional(),

  // Geo
  DEFAULT_LATITUDE: z.coerce.number().default(6.5244),
  DEFAULT_LONGITUDE: z.coerce.number().default(3.3792),
  MAX_SEARCH_RADIUS_KM: z.coerce.number().default(50),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid env vars:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;