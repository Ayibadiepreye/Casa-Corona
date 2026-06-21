import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cc_cookie_consent_v1";

type Consent = "accepted" | "rejected" | null;

function recordConsent(value: "accepted" | "rejected", analytics: boolean) {
  const payload = {
    choice: value,
    analytics,
    timestamp: new Date().toISOString(),
    version: 1,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  // Best-effort notify server. Don't block the UI.
  fetch("/api/v1/compliance/cookie-consent", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choice: value, analytics }),
  }).catch(() => {});
}

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConsent(JSON.parse(stored).choice ?? null);
        return;
      }
    } catch {}
    // Show banner after a tiny delay so it doesn't compete with the hero render
    const t = setTimeout(() => setConsent(null), 800);
    return () => clearTimeout(t);
  }, []);

  // Don't render anything if user has already chosen
  if (consent === "accepted" || consent === "rejected") return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:bottom-6 sm:right-auto sm:max-w-md z-50 animate-in slide-in-from-bottom-4 fade-in"
    >
      <div className="bg-card border shadow-2xl shadow-foreground/5 rounded-2xl p-5 backdrop-blur-md bg-card/95">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">We use cookies</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              We use essential cookies to keep you signed in. With your permission
              we also use analytics cookies to improve the platform.{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-primary">
                Read more
              </Link>
            </p>
          </div>
          <button
            onClick={() => recordConsent("rejected", false)}
            className="text-muted-foreground hover:text-foreground -mr-1 -mt-1 p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showDetails && (
          <div className="mb-3 pl-12 space-y-2 text-xs">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked disabled className="mt-0.5 accent-primary" />
              <span className="text-muted-foreground">
                <strong className="text-foreground">Essential</strong> — Required for sign-in, CSRF protection, and bookings. Always on.
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={analytics}
                onChange={e => setAnalytics(e.target.checked)}
                className="mt-0.5 accent-primary"
              />
              <span className="text-muted-foreground">
                <strong className="text-foreground">Analytics</strong> — Helps us understand which features you use so we can improve them.
              </span>
            </label>
          </div>
        )}

        <div className="flex gap-2 items-center pl-12">
          <Button
            size="sm"
            className="rounded-full flex-1"
            onClick={() => {
              recordConsent("accepted", analytics);
              setConsent("accepted");
            }}
          >
            Accept all
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full flex-1"
            onClick={() => {
              recordConsent("rejected", false);
              setConsent("rejected");
            }}
          >
            Essential only
          </Button>
          <button
            onClick={() => setShowDetails(s => !s)}
            className="text-xs text-muted-foreground hover:text-foreground px-2"
          >
            {showDetails ? "Hide" : "Details"}
          </button>
        </div>
      </div>
    </div>
  );
}
