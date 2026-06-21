-- Migration: Add newsletter_subscribers table
-- Run this SQL against your PostgreSQL database

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT true,
  source TEXT DEFAULT 'footer',
  subscribed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_email_idx ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_subscribed_idx ON newsletter_subscribers(subscribed);

-- Add some comments for documentation
COMMENT ON TABLE newsletter_subscribers IS 'Stores email addresses of users who subscribe via the "Stay in the loop" footer form';
COMMENT ON COLUMN newsletter_subscribers.source IS 'Where the subscription came from: footer, landing_page, etc.';
COMMENT ON COLUMN newsletter_subscribers.subscribed IS 'Whether currently subscribed (false if unsubscribed)';
