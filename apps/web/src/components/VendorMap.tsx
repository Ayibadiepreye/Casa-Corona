import { useState, useEffect } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * Lightweight, dependency-free map component using OpenStreetMap embeds.
 * Falls back to a "View on Google Maps" link if no lat/lng.
 *
 * Props:
 *   - lat, lng: optional coordinates
 *   - city, state, address: free-form location text (used when coords are absent)
 *   - vendorName: label for accessibility
 *   - height: pixel height (default 320)
 */
export default function VendorMap({
  lat,
  lng,
  city,
  state,
  address,
  vendorName,
  height = 320,
}: {
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  vendorName?: string;
  height?: number;
}) {
  // OSM embed works with either coords or a search query
  const hasCoords = typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng);
  const query = hasCoords
    ? `${lat},${lng}`
    : encodeURIComponent([address, city, state].filter(Boolean).join(", "));
  const bbox = hasCoords
    ? `${(lng as number) - 0.02},${(lat as number) - 0.01},${(lng as number) + 0.02},${(lat as number) + 0.01}`
    : "";
  const src = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
    : `https://www.openstreetmap.org/export/embed.html?layer=mapnik&q=${query}`;
  const link = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`
    : `https://www.openstreetmap.org/search?query=${query}`;

  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) return null;

  // No location info at all
  if (!hasCoords && !query) {
    return (
      <Card className="flex items-center justify-center text-center p-8 text-muted-foreground" style={{ height }}>
        <div>
          <MapPin className="mx-auto mb-2 opacity-50" size={32} />
          <p className="text-sm">No location set for this business yet.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border" style={{ height }}>
      <iframe
        title={`Map showing ${vendorName || "business"}`}
        src={src}
        className="w-full h-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 bg-white dark:bg-slate-800 shadow-md rounded-full px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1"
      >
        <ExternalLink size={12} />
        View larger map
      </a>
    </div>
  );
}