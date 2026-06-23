-- Casa Corona Database Schema Export
-- This file contains the complete database schema
-- To use: Run this on a fresh PostgreSQL database to recreate all tables

-- ============================================================================
-- ENUMS (Custom Types)
-- ============================================================================

CREATE TYPE "public"."user_role" AS ENUM('customer', 'vendor', 'moderator', 'admin', 'super_admin');
CREATE TYPE "public"."price_range" AS ENUM('budget', 'mid', 'premium', 'luxury');
CREATE TYPE "public"."subscription_status" AS ENUM('inactive', 'active', 'expired', 'cancelled');
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE "public"."payment_status_enum" AS ENUM('pending', 'success', 'failed', 'refunded');
CREATE TYPE "public"."payment_type" AS ENUM('subscription', 'registration', 'featured', 'commission');
CREATE TYPE "public"."subscription_plan" AS ENUM('monthly', '3month', '6month', '12month');
CREATE TYPE "public"."subscription_record_status" AS ENUM('pending', 'active', 'expired', 'cancelled', 'failed');
CREATE TYPE "public"."notification_type" AS ENUM('message', 'review', 'booking', 'payment', 'subscription', 'announcement', 'follow');
CREATE TYPE "public"."message_type" AS ENUM('text', 'image', 'file', 'system');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (core authentication and profile data)
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text NOT NULL,
	"phone" text,
	"avatar_url" text,
	"city" text,
	"state" text,
	"country" text DEFAULT 'Nigeria',
	"bio" text,
	"location" jsonb,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp,
	"last_login_at" timestamp,
	"suspended" boolean DEFAULT false NOT NULL,
	"suspended_reason" text,
	"deleted_at" timestamp,
	"notification_preferences" text DEFAULT '{}',
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"reset_token" text,
	"reset_token_expires_at" timestamp,
	"refresh_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Categories table (service categories)
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);

-- Vendors table (business profiles)
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"business_name" text NOT NULL,
	"description" text,
	"category_id" uuid,
	"whatsapp" text,
	"phone" text,
	"email" text,
	"website" text,
	"instagram" text,
	"twitter" text,
	"facebook" text,
	"tiktok" text,
	"address" text,
	"city" text,
	"state" text,
	"country" text DEFAULT 'Nigeria' NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"logo_url" text,
	"cover_url" text,
	"hours" jsonb,
	"holidays" jsonb,
	"years_in_business" text,
	"team_size" text,
	"price_range" "price_range",
	"service_area" text,
	"verified" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"featured_until" timestamp,
	"subscription_status" "subscription_status" DEFAULT 'inactive' NOT NULL,
	"subscription_expires_at" timestamp,
	"total_views" integer DEFAULT 0 NOT NULL,
	"total_saves" integer DEFAULT 0 NOT NULL,
	"total_followers" integer DEFAULT 0 NOT NULL,
	"average_rating" double precision DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_user_id_unique" UNIQUE("user_id"),
	"vendors_slug_unique" UNIQUE("slug")
);

-- ============================================================================
-- VENDOR OFFERINGS
-- ============================================================================

-- Services offered by vendors
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_min" integer NOT NULL,
	"price_max" integer,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"duration_minutes" integer,
	"popular" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Products sold by vendors
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"buy_link" text,
	"images" text[],
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Portfolio/Gallery images
CREATE TABLE "portfolio_shots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"public_id" text,
	"caption" text,
	"category" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- BOOKINGS & REVIEWS
-- ============================================================================

-- Booking requests
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"service_id" uuid,
	"scheduled_for" timestamp NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text NOT NULL,
	"notes" text,
	"vendor_notes" text,
	"total_amount" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Customer reviews
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"booking_id" uuid,
	"rating" integer NOT NULL,
	"content" text NOT NULL,
	"photos" text[],
	"vendor_reply" text,
	"vendor_reply_at" timestamp,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"reported" boolean DEFAULT false NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- SOCIAL FEATURES
-- ============================================================================

-- User following vendors
CREATE TABLE "follows" (
	"follower_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "follows_follower_id_vendor_id_pk" PRIMARY KEY("follower_id","vendor_id")
);

-- Saved vendors (bookmarks)
CREATE TABLE "saved_vendors" (
	"user_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_vendors_user_id_vendor_id_pk" PRIMARY KEY("user_id","vendor_id")
);

-- ============================================================================
-- PAYMENTS & SUBSCRIPTIONS
-- ============================================================================

-- Payment records
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid,
	"user_id" uuid NOT NULL,
	"reference" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"channel" text,
	"status" "payment_status_enum" DEFAULT 'pending' NOT NULL,
	"type" "payment_type" NOT NULL,
	"paystack_data" jsonb,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_reference_unique" UNIQUE("reference")
);

-- Subscription records
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"paystack_reference" text,
	"paystack_customer_code" text,
	"status" "subscription_record_status" DEFAULT 'pending' NOT NULL,
	"auto_renew" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_paystack_reference_unique" UNIQUE("paystack_reference")
);

-- ============================================================================
-- NOTIFICATIONS & MESSAGING
-- ============================================================================

-- User notifications
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"data" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Vendor auto-reply settings
CREATE TABLE "auto_replies" (
	"vendor_id" uuid PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"message" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Blocked users
CREATE TABLE "blocked_users" (
	"blocker_id" uuid NOT NULL,
	"blocked_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Conversations between customers and vendors
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"last_message_at" timestamp,
	"customer_unread" integer DEFAULT 0 NOT NULL,
	"vendor_unread" integer DEFAULT 0 NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Messages within conversations
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_role" text NOT NULL,
	"content" text,
	"type" "message_type" DEFAULT 'text' NOT NULL,
	"attachment_url" text,
	"read_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Quick reply templates
CREATE TABLE "quick_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- ADMIN & SYSTEM
-- ============================================================================

-- Platform announcements
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"target_role" text[],
	"active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Audit logs for admin actions
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"changes" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- FAQ entries
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Featured vendor rotation schedule
CREATE TABLE "featured_rotation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"slot" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Login history for security
CREATE TABLE "login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"device" text,
	"location" text,
	"success" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Platform-wide settings
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"category" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid
);

-- Push notification subscriptions
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"keys" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Saved search queries
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"query" text NOT NULL,
	"filters" jsonb,
	"alert_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "services" ADD CONSTRAINT "services_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "portfolio_shots" ADD CONSTRAINT "portfolio_shots_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "follows" ADD CONSTRAINT "follows_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "saved_vendors" ADD CONSTRAINT "saved_vendors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "saved_vendors" ADD CONSTRAINT "saved_vendors_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "auto_replies" ADD CONSTRAINT "auto_replies_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "quick_replies" ADD CONSTRAINT "quick_replies_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "featured_rotation" ADD CONSTRAINT "featured_rotation_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX "users_email_idx" ON "users" USING btree ("email");
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");
CREATE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
CREATE INDEX "vendors_slug_idx" ON "vendors" USING btree ("slug");
CREATE INDEX "vendors_city_state_idx" ON "vendors" USING btree ("city","state");
CREATE INDEX "vendors_category_idx" ON "vendors" USING btree ("category_id");
CREATE INDEX "vendors_subscription_idx" ON "vendors" USING btree ("subscription_status");
CREATE INDEX "services_vendor_idx" ON "services" USING btree ("vendor_id");
CREATE INDEX "products_vendor_idx" ON "products" USING btree ("vendor_id");
CREATE INDEX "portfolio_vendor_idx" ON "portfolio_shots" USING btree ("vendor_id");
CREATE INDEX "bookings_customer_idx" ON "bookings" USING btree ("customer_id");
CREATE INDEX "bookings_vendor_idx" ON "bookings" USING btree ("vendor_id");
CREATE INDEX "bookings_scheduled_idx" ON "bookings" USING btree ("scheduled_for");
CREATE INDEX "reviews_vendor_idx" ON "reviews" USING btree ("vendor_id");
CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id");
CREATE INDEX "follows_follower_idx" ON "follows" USING btree ("follower_id");
CREATE INDEX "saved_user_idx" ON "saved_vendors" USING btree ("user_id");
CREATE INDEX "payments_vendor_idx" ON "payments" USING btree ("vendor_id");
CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id");
CREATE INDEX "payments_reference_idx" ON "payments" USING btree ("reference");
CREATE INDEX "subscriptions_vendor_idx" ON "subscriptions" USING btree ("vendor_id");
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","read");
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");
CREATE INDEX "conversations_customer_idx" ON "conversations" USING btree ("customer_id");
CREATE INDEX "conversations_vendor_idx" ON "conversations" USING btree ("vendor_id");
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id");
CREATE INDEX "messages_expires_idx" ON "messages" USING btree ("expires_at");
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor_id");
CREATE INDEX "login_history_user_idx" ON "login_history" USING btree ("user_id");

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This schema represents the complete Casa Corona database structure
-- To migrate to a new database:
-- 1. Create a new PostgreSQL database
-- 2. Run this file: psql -d your_new_database -f database-schema-export.sql
-- 3. Update your DATABASE_URL in .env to point to the new database
-- 4. The application should work without any code changes
-- ============================================================================
