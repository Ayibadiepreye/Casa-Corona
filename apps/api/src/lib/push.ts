import webpush from "web-push";
import { env } from "./env.js";

let initialized = false;

function ensureInit() {
  if (initialized) return true;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    return false;
  }
  try {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
    initialized = true;
    return true;
  } catch (e) {
    console.error("[push] init failed:", e);
    return false;
  }
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: Record<string, any>;
}

export async function sendPushToSubscription(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload
): Promise<boolean> {
  if (!ensureInit()) {
    console.warn("[push] VAPID not configured — push notification skipped");
    return false;
  }
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 } // 24h
    );
    return true;
  } catch (e: any) {
    console.error("[push] send failed:", e?.message || e);
    return false;
  }
}

export async function sendPushBatch(
  subscriptions: Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  let sent = 0, failed = 0;
  for (const sub of subscriptions) {
    const ok = await sendPushToSubscription(sub, payload);
    if (ok) sent++; else failed++;
  }
  return { sent, failed };
}

export function isPushConfigured(): boolean {
  return !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
}