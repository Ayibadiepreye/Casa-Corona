import { db } from "./index";
import { platformSettingsTable, categoriesTable } from "./schema";

async function seed() {
  console.log("Seeding platform settings...");

  const settings = [
    {
      key: "pricing",
      value: {
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
      category: "pricing",
    },
    {
      key: "subscription",
      value: {
        warning_days: [5, 2, 1],
        grace_period_days: 7,
        auto_renewal_default: false,
        prorated_refunds: false,
      },
      category: "subscription",
    },
    {
      key: "chat",
      value: {
        timeout_hours: 24,
        export_retention_days: 7,
        max_message_length: 5000,
        max_file_size_mb: 10,
        typing_indicators: true,
        read_receipts: true,
        online_status: true,
      },
      category: "chat",
    },
    {
      key: "features",
      value: {
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
      },
      category: "features",
    },
    {
      key: "limits",
      value: {
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
      category: "limits",
    },
    {
      key: "content",
      value: {
        welcome_message: "Welcome to Casa Corona",
        support_email: "support@casacorona.org",
        maintenance_message: "We'll be back soon",
      },
      category: "content",
    },
    {
      key: "geo",
      value: {
        default_latitude: 6.5244,
        default_longitude: 3.3792,
        max_search_radius_km: 50,
      },
      category: "geo",
    },
    {
      key: "cron",
      value: {
        enabled: true,
        subscription_check: "0 9 * * *",
        chat_cleanup: "0 0 * * *",
        analytics_aggregate: "0 1 * * *",
      },
      category: "cron",
    },
  ];

  for (const s of settings) {
    await db.insert(platformSettingsTable).values({
      key: s.key,
      value: s.value,
      category: s.category,
    }).onConflictDoNothing();
  }

  console.log("Seeding categories...");
  const cats = [
    { slug: "beauty-hair", name: "Beauty & Hair", icon: "Scissors", displayOrder: 1, active: true },
    { slug: "makeup-artistry", name: "Makeup Artistry", icon: "Brush", displayOrder: 2, active: true },
    { slug: "skincare-spa", name: "Skincare & Spa", icon: "Droplets", displayOrder: 3, active: true },
    { slug: "nails", name: "Nails", icon: "Sparkles", displayOrder: 4, active: true },
    { slug: "photography", name: "Photography", icon: "Camera", displayOrder: 5, active: true },
    { slug: "fitness-wellness", name: "Fitness & Wellness", icon: "Heart", displayOrder: 6, active: true },
    { slug: "event-planning", name: "Event Planning", icon: "PartyPopper", displayOrder: 7, active: true },
    { slug: "fashion-styling", name: "Fashion & Styling", icon: "Shirt", displayOrder: 8, active: true },
    { slug: "catering-food", name: "Catering & Food", icon: "UtensilsCrossed", displayOrder: 9, active: true },
    { slug: "arts-crafts", name: "Arts & Crafts", icon: "PenTool", displayOrder: 10, active: true },
  ];

  for (const c of cats) {
    await db.insert(categoriesTable).values(c).onConflictDoNothing();
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

