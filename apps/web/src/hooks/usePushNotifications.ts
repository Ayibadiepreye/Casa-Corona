import { useEffect, useState, useCallback } from "react";

/**
 * Hook for Web Push subscriptions.
 *
 * Behavior:
 *  - On mount: if the browser supports push and the user is logged in,
 *    fetch the VAPID public key, register the service worker, and
 *    attempt to subscribe. We DO NOT auto-request notification permission
 *    on page load — the user must click "Enable notifications" so the
 *    browser shows its native permission prompt at a predictable moment.
 *  - Returns helpers: `subscribe()` (requests permission + subscribes),
 *    `unsubscribe()`, plus current state.
 */
export type PushState = "unsupported" | "idle" | "subscribing" | "subscribed" | "denied" | "error";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const API_BASE = () =>
  ((import.meta as any).env?.VITE_API_URL as string) || "http://localhost:5000/api/v1";

export function usePushNotifications(isLoggedIn: boolean) {
  const [state, setState] = useState<PushState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  // Check if push is even possible in this browser
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    // Register SW early so the browser is ready when user enables
    navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("[push] SW register failed", e));

    if (Notification.permission === "denied") setState("denied");
    if (Notification.permission === "granted") setState("subscribed");
  }, []);

  // Fetch VAPID public key from API
  useEffect(() => {
    if (!isLoggedIn) return;
    if (state === "unsupported") return;
    (async () => {
      try {
        const API = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api/v1";
        const res = await fetch(`${API}/me/push-subscribe/vapid-public-key`, { credentials: "include" });
        if (!res.ok) return; // not implemented; we stay idle
        const json = await res.json();
        const key = json?.data?.publicKey || json?.publicKey;
        if (typeof key === "string" && key.length > 10) setVapidKey(key);
      } catch {
        // ignore
      }
    })();
  }, [isLoggedIn, state]);

  const subscribe = useCallback(async () => {
    if (state === "unsupported" || state === "denied") return;
    if (!vapidKey) {
      setError("Push notifications are not yet configured on the server.");
      return;
    }
    setState("subscribing");
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "idle");
        if (permission === "denied") setError("Notifications are blocked in your browser settings.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });
      const json = sub.toJSON();
      const subPayload = {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      };
      const res = await fetch(`${API_BASE()}/me/push-subscribe`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subPayload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || `Server returned ${res.status}`);
      }
      setState("subscribed");
    } catch (e: any) {
      setError(e?.message || "Failed to subscribe");
      setState("error");
    }
  }, [state, vapidKey]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const API = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api/v1";
        await fetch(`${API}/me/push-subscribe`, {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("idle");
    } catch (e: any) {
      setError(e?.message || "Failed to unsubscribe");
    }
  }, []);

  return { state, error, subscribe, unsubscribe, isSupported: state !== "unsupported" };
}