import { useEffect, useState } from "react";

export function usePlatformSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
    fetch(`${apiUrl}/settings/public`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setSettings(d.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}
