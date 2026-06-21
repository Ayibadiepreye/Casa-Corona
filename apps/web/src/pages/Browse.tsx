import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Heart, LayoutGrid, Rows3, MapPin, X } from "lucide-react";
import { BusinessCard } from "@/components/BusinessCard";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useApi } from "@/hooks/useApi";
import { categoryApi, searchApi, Vendor, Category } from "@/lib/api-client";

const ALL_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara"
];

type Tab = "work" | "professionals";

/** Debounce a value by `delay` ms */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Browse() {
  const [tab, setTab] = useState<Tab>("professionals");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeState, setActiveState] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "rating" | "newest">("featured");
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch categories for the filter strip
  const { data: categoriesData } = useApi<Category[]>(() => categoryApi.list());
  const categories = categoriesData ?? [];

  // Build search params — only pass values when non-empty
  const searchParams = useMemo(() => ({
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
    ...(activeCategory !== "all" ? { category: activeCategory } : {}),
    ...(activeState ? { state: activeState } : {}),
    sort: sortBy,
  }), [debouncedSearch, activeCategory, activeState, sortBy]);

  const { data: vendorsData, loading: vendorsLoading } = useApi<{ vendors: Vendor[], total: number, page: number, pages: number }>(
    () => searchApi.searchVendors(searchParams),
    [debouncedSearch, activeCategory, activeState, sortBy]
  );
  const vendors = vendorsData?.vendors ?? [];

  const hasFilters = activeCategory !== "all" || activeState !== "" || search !== "";

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="pt-8 pb-6 px-4 sm:px-6 lg:px-8 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-1">Explore</h1>
          <p className="text-muted-foreground text-sm mb-6">Discover talented professionals from every corner of Nigeria</p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, skill, location, or tag..."
                className="pl-11 h-12 rounded-full bg-background text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* State filter */}
            <div className="relative">
              <button
                onClick={() => setShowStateDropdown(s => !s)}
                className="flex items-center gap-2 h-12 px-5 rounded-full border bg-background text-sm font-medium hover:border-primary/40 transition-colors whitespace-nowrap"
              >
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {activeState || "All Nigeria"}
                {activeState && (
                  <span onClick={(e) => { e.stopPropagation(); setActiveState(""); }} className="ml-1 text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" />
                  </span>
                )}
              </button>
              {showStateDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-card border rounded-2xl shadow-xl z-50 w-56 max-h-64 overflow-y-auto p-2">
                  <button
                    onClick={() => { setActiveState(""); setShowStateDropdown(false); }}
                    className={cn("w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-muted transition-colors", activeState === "" && "font-semibold text-primary")}
                  >
                    All Nigeria
                  </button>
                  {ALL_STATES.map(s => (
                    <button
                      key={s}
                      onClick={() => { setActiveState(s); setShowStateDropdown(false); }}
                      className={cn("w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-muted transition-colors", activeState === s && "font-semibold text-primary")}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs + category strip ──────────────────────────────────────────── */}
      <div className="sticky top-[80px] z-40 bg-background/95 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 pt-3">
            <button
              onClick={() => setTab("professionals")}
              className={cn("pb-3 text-sm font-medium border-b-2 transition-colors", tab === "professionals" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              Professionals
            </button>
            <button
              onClick={() => setTab("work")}
              className={cn("pb-3 text-sm font-medium border-b-2 transition-colors", tab === "work" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              Work
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border", activeCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground/70 border-border hover:border-primary/40 hover:text-primary")}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.slug)}
              className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap", activeCategory === c.slug ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground/70 border-border hover:border-primary/40 hover:text-primary")}
            >
              {c.name}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 shrink-0 pl-4">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs border rounded-full px-3 py-1.5 bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="featured">Featured</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest</option>
            </select>
            <div className="flex bg-muted/50 p-0.5 rounded-full border">
              <button
                className={cn("p-1.5 rounded-full transition-colors", layout === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                onClick={() => setLayout("grid")}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                className={cn("p-1.5 rounded-full transition-colors", layout === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                onClick={() => setLayout("list")}
              >
                <Rows3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active filter pills ────────────────────────────────────────────── */}
      {hasFilters && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {vendorsLoading ? "Searching..." : `${vendors.length} results`}
          </span>
          <button
            onClick={() => { setSearch(""); setActiveCategory("all"); setActiveState(""); }}
            className="text-xs text-primary hover:underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tab === "professionals" ? (
          vendorsLoading ? (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : vendors.length > 0 ? (
            <div className={cn("grid gap-5", layout === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2")}>
              {vendors.map((vendor, i) => (
                <motion.div key={vendor.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <BusinessCard vendor={vendor} layout={layout} />
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState onClear={() => { setSearch(""); setActiveCategory("all"); setActiveState(""); }} />
          )
        ) : (
          // Work tab — portfolio coming in a future phase
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
              <Heart className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-bold mb-2">Portfolio feed coming soon</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
              Browse the Professionals tab to discover talented vendors, or check back soon for the portfolio feed.
            </p>
            <Button variant="outline" className="rounded-full" onClick={() => setTab("professionals")}>
              Browse Professionals
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="py-24 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
        <Search className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-serif font-bold mb-2">Nothing found</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">Try a different search term or adjust your filters.</p>
      <Button variant="outline" className="rounded-full" onClick={onClear}>Clear filters</Button>
    </div>
  );
}
