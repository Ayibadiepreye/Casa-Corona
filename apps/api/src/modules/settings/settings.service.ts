
import { db, platformSettingsTable, auditLogsTable } from "@casa-corona/db";
import { eq } from "drizzle-orm";

const DEFAULTS = {
  pricing: {
    registration_fee: 45000,
    monthly_subscription: 7000,
    featured_slot: 25000,
    bulk_discount_3: 5,
    bulk_discount_6: 10,
    bulk_discount_12: 20,
    currency: "NGN",
    commission_type: "percentage",
    commission_value: 5,
  },
  subscription: {
    warning_days: [5, 2, 1],
    grace_period_days: 7,
    auto_renewal_default: false,
    prorated_refunds: false,
  },
  chat: {
    timeout_hours: 24,
    export_retention_days: 7,
    max_message_length: 5000,
    max_file_size_mb: 10,
    typing_indicators: true,
    read_receipts: true,
    online_status: true,
  },
  features: {
    enable_2fa: true,
    enable_push_notifications: true,
    enable_captcha: false,
    enable_email_verification: true,
    enable_maintenance_mode: false,
    featured_listings: true,
    map_view: true,
    push_notifications: true,
    captcha: true,
    maintenance: false,
    email_verification_required: true,
    auto_verify_on_payment: false,
  },
  limits: {
    max_portfolio_per_business: 50,
    max_services_per_business: 30,
    max_products_per_business: 50,
    max_review_photos: 5,
    max_review_length: 1000,
    max_business_description_length: 2000,
    max_login_attempts: 5,
    login_lockout_duration_minutes: 30,
    bcrypt_salt_rounds: 10,
    rate_limit_window_ms: 900000,
    rate_limit_max_requests: 100,
    max_file_size_mb: 10,
  },
  content: {
    welcome_message: "Welcome to Casa Corona",
    support_email: "support@casacorona.org",
    maintenance_message: "We'll be back soon",
  },
  geo: {
    default_latitude: 6.5244,
    default_longitude: 3.3792,
    max_search_radius_km: 50,
  },
  cron: {
    enabled: true,
    subscription_check: "0 9 * * *",
    chat_cleanup: "0 0 * * *",
    analytics_aggregate: "0 1 * * *",
  },
};

const CACHE_DURATION_MS = 60_000; // 60 seconds
const cache: Record<string, { data: any; expiresAt: number }> = {};

async function getSettingsByKey<K extends keyof typeof DEFAULTS>(
  key: K
): Promise<(typeof DEFAULTS)[K]> {
  const now = Date.now();
  if (cache[key] && cache[key].expiresAt > now) {
    return cache[key].data;
  }

  const [setting] = await db
    .select()
    .from(platformSettingsTable)
    .where(eq(platformSettingsTable.key, key));

  const data = { ...DEFAULTS[key], ...(setting?.value as any) };
  cache[key] = { data, expiresAt: now + CACHE_DURATION_MS };
  return data;
}

function invalidateCache(key?: string) {
  if (key) delete cache[key];
  else Object.keys(cache).forEach((k) => delete cache[k]);
}

export async function getPricing() {
  return getSettingsByKey("pricing");
}

export async function getSubscription() {
  return getSettingsByKey("subscription");
}

export async function getChat() {
  return getSettingsByKey("chat");
}

export async function getFeatures() {
  return getSettingsByKey("features");
}

export async function getLimits() {
  return getSettingsByKey("limits");
}

export async function getContent() {
  return getSettingsByKey("content");
}

export async function getGeo() {
  return getSettingsByKey("geo");
}

export async function getCron() {
  return getSettingsByKey("cron");
}

export async function getAll() {
  const settings = await db.select().from(platformSettingsTable);
  const settingsMap: any = { ...DEFAULTS };
  for (const s of settings) {
    settingsMap[s.key] = { ...DEFAULTS[s.key as keyof typeof DEFAULTS], ...(s.value as any) };
  }
  return settingsMap;
}

export async function getPublicSettings() {
  const pricing = await getPricing();
  const features = await getFeatures();
  const limits = await getLimits();
  return { pricing, features, limits };
}

export async function getAdminSettings() {
  return getAll();
}

export async function updateSettings(category: string, updates: any, actorId: string) {
  // Merge with existing settings in DB first
  const existing = await getSettingsByKey(category as keyof typeof DEFAULTS);
  const merged = { ...existing, ...updates };

  await db
    .insert(platformSettingsTable)
    .values({ key: category, value: merged, category, updatedBy: actorId })
    .onConflictDoUpdate({
      target: platformSettingsTable.key,
      set: { value: merged, updatedAt: new Date(), updatedBy: actorId },
    });
  await db.insert(auditLogsTable).values({
    actorId,
    action: "update_settings",
    resourceType: "settings",
    resourceId: category,
    changes: updates,
  });

  invalidateCache(category);
  return getAdminSettings();
}
