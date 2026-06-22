import { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Heart, Search, ArrowRight, CheckCircle, Star, ShieldCheck,
  Users, Zap, BarChart3, Globe, MessageCircle, Sparkles, MapPin,
  TrendingUp, Award, Calendar, Scissors
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { vendorApi, categoryApi, searchApi, Vendor } from "@/lib/api-client";
import { BusinessCard } from "@/components/BusinessCard";

const ICON_MAP: Record<string, any> = {
  Scissors, Sparkles, Heart, Star, Calendar, Award, Globe, Users, MapPin,
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [proTab, setProTab] = useState(0);
  const [direction, setDirection] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollPositionRef = useRef(0);
  const lastTimestampRef = useRef(0);

  const { data: categoriesData } = useApi(() => categoryApi.list());
  const { data: featuredVendorsData } = useApi(() => vendorApi.list({ featured: true, limit: 12 }));
  const { data: trendingVendorsData } = useApi(() => searchApi.getTrending());
  const { data: topRatedVendorsData } = useApi(() => vendorApi.list({ sort: "rating", limit: 12 }));
  const { data: newestVendorsData } = useApi(() => vendorApi.list({ sort: "newest", limit: 12 }));

  // Fetch vendors for the currently selected category pill
  const { data: categoryVendorsData } = useApi(
    () => activeCategory === "all"
      ? vendorApi.list({ limit: 12 })
      : vendorApi.list({ category: activeCategory, limit: 12 }),
    [activeCategory]
  );

  const categories = categoriesData ?? [];
  const featuredVendors = featuredVendorsData?.vendors ?? [];
  const trendingVendors = trendingVendorsData ?? [];
  const topRatedVendors = topRatedVendorsData?.vendors ?? [];
  const newestVendors = newestVendorsData?.vendors ?? [];
  const categoryVendors = categoryVendorsData?.vendors ?? [];

  const PRO_TABS = useMemo(() => [
    { label: "Featured", emoji: "⭐", vendors: featuredVendors },
    { label: "Top Rated", emoji: "🏆", vendors: topRatedVendors },
    { label: "New Arrivals", emoji: "✨", vendors: newestVendors },
    { label: "Trending", emoji: "🔥", vendors: trendingVendors },
  ], [featuredVendors, topRatedVendors, newestVendors, trendingVendors]);

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setProTab(t => (t + 1) % PRO_TABS.length);
    }, 8000); // slowed from 4.5s to 8s
  };

  useEffect(() => {
    startInterval();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Pause rotation when window is unfocused or user is interacting
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      } else {
        startInterval();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const switchTab = (idx: number) => {
    setDirection(idx > proTab ? 1 : -1);
    setProTab(idx);
    startInterval();
  };

  // Auto-scroll category carousel - buttery smooth flow with timestamp-based animation
  useEffect(() => {
    const scrollContainer = categoryScrollRef.current;
    if (!scrollContainer || categories.length === 0) return;

    // Scroll speed: pixels per second
    const SCROLL_SPEED = 60;
    
    // Initialize as not user scrolling so auto-scroll starts immediately
    isUserScrollingRef.current = false;
    let isProgrammaticScroll = false;

    const smoothScroll = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      if (!isUserScrollingRef.current && scrollContainer) {
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        
        // Calculate scroll distance based on time elapsed (smooth regardless of frame rate)
        const scrollDistance = (SCROLL_SPEED * deltaTime) / 1000;
        scrollPositionRef.current += scrollDistance;
        
        // Loop back to start when reaching the end
        if (scrollPositionRef.current >= maxScroll) {
          scrollPositionRef.current = 0;
        }
        
        // Mark as programmatic so scroll event doesn't interfere
        isProgrammaticScroll = true;
        scrollContainer.scrollLeft = scrollPositionRef.current;
        isProgrammaticScroll = false;
      }
      
      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(smoothScroll);
    };

    // Start smooth auto-scroll
    animationFrameRef.current = requestAnimationFrame(smoothScroll);

    const handleScroll = () => {
      // Ignore programmatic scrolls from our animation
      if (isProgrammaticScroll) return;
      
      isUserScrollingRef.current = true;
      scrollPositionRef.current = scrollContainer.scrollLeft;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Resume auto-scroll after 2 seconds of no interaction
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
        lastTimestampRef.current = 0; // Reset timestamp for smooth resume
      }, 2000);
    };

    const handleTouchStart = () => {
      isUserScrollingRef.current = true;
      scrollPositionRef.current = scrollContainer.scrollLeft;
    };

    const handleMouseDown = () => {
      isUserScrollingRef.current = true;
      scrollPositionRef.current = scrollContainer.scrollLeft;
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollContainer.addEventListener('mousedown', handleMouseDown, { passive: true });

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('mousedown', handleMouseDown);
    };
  }, [categories]);

  const handleCategoryClick = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling to page
    setActiveCategory(categoryId);
  };

  const activeVendors = PRO_TABS[proTab].vendors.slice(0, 4);
  const activeCategoryName =
    activeCategory === "all"
      ? "All Categories"
      : categories.find(c => c.slug === activeCategory)?.name || "Category";

  return (
    <div className="flex flex-col bg-background">

      {/* ── Hero with animated gradient mesh ─────────────────────────────── */}
      <section className="relative pt-20 pb-12 sm:pt-24 sm:pb-16 md:pt-32 md:pb-24 px-3 sm:px-4 text-center overflow-hidden">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/8" />
          <motion.div
            className="absolute -top-20 -left-20 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-primary/15 blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-20 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-accent/20 blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 left-1/3 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] rounded-full bg-primary/8 blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Brand pill with glow */}
            <span className="inline-flex items-center gap-2 mb-4 sm:mb-6 py-1.5 px-3 sm:px-4 rounded-full text-[10px] sm:text-xs font-semibold border bg-primary/10 border-primary/30 text-primary backdrop-blur-sm shadow-sm shadow-primary/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Nigeria's Premium Self-Care Network
            </span>

            {/* Headline with multi-stop brand gradient */}
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-serif font-bold tracking-tight mb-4 sm:mb-6 leading-[1.1] sm:leading-[1.05]">
              <span className="text-foreground">
                Find Exceptional
              </span>
              <br />
              <span className="text-emerald-gold">
                Beauty &amp; Wellness
              </span>
              <br />
              <span className="text-brand-gradient">
                Near You
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-10 max-w-xl mx-auto leading-relaxed px-2">
              Discover and book top-rated salons, spas, barbers, and aesthetic clinics across Lagos, Abuja, and Port Harcourt.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center max-w-sm sm:max-w-none mx-auto px-2">
              <Button size="lg" className="rounded-full px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base gap-2 glow-primary btn-shine" asChild>
                <Link href="/browse"><Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Explore Work</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base border-2 hover:border-primary/50 hover:bg-primary/5 btn-shine" asChild>
                <Link href="/signup">List Your Business <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" /></Link>
              </Button>
            </div>

            {/* Trust badges with subtle backdrop */}
            <div className="mt-6 sm:mt-10 inline-flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-3 text-[10px] sm:text-xs text-muted-foreground px-3 sm:px-5 py-2 sm:py-3 rounded-full glass">
              <span className="inline-flex items-center gap-1 sm:gap-1.5"><CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" /> Verified businesses</span>
              <span className="inline-flex items-center gap-1 sm:gap-1.5"><ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" /> Secure messaging</span>
              <span className="inline-flex items-center gap-1 sm:gap-1.5"><Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" /> Real reviews</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Category pills with vendor display ───────────────────────────── */}
      <section className="px-3 sm:px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold mb-1.5 sm:mb-2">Browse by Category</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Choose a category to see professionals near you</p>
          </div>

          {/* Category pills — manually scrollable with auto-scroll */}
          <div className="relative mb-6 sm:mb-8">
            <div
              ref={categoryScrollRef}
              className="flex gap-1.5 sm:gap-2 py-2 overflow-x-auto no-scrollbar scroll-smooth"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {/* Add "All" button */}
              <button
                type="button"
                onClick={(e) => handleCategoryClick("all", e)}
                className={cn(
                  "shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border whitespace-nowrap transition-all",
                  activeCategory === "all"
                    ? "bg-gradient-to-r from-primary to-emerald-600 text-white border-primary shadow-md shadow-primary/20"
                    : "bg-background text-foreground/70 border-border hover:border-primary/40 hover:text-primary"
                )}
              >
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                All
              </button>
              
              {/* Category buttons - simple linear list */}
              {categories.map((cat) => {
                const Icon = ICON_MAP[cat.icon || "Sparkles"] || Sparkles;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={(e) => handleCategoryClick(cat.slug, e)}
                    className={cn(
                      "shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border whitespace-nowrap transition-all",
                      activeCategory === cat.slug
                        ? "bg-gradient-to-r from-primary to-emerald-600 text-white border-primary shadow-md shadow-primary/20"
                        : "bg-background text-foreground/70 border-border hover:border-primary/40 hover:text-primary"
                    )}
                  >
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vendors under selected category */}
          <div className="mb-6">
            <div className="flex items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-serif font-bold flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span>{activeCategoryName}</span>
                  <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                    ({categoryVendors.length} {categoryVendors.length === 1 ? "professional" : "professionals"})
                  </span>
                </h3>
              </div>
              <Link href={`/browse${activeCategory !== "all" ? `?category=${activeCategory}` : ""}`}
                className="hidden sm:flex items-center gap-1 text-xs sm:text-sm text-primary font-medium hover:underline shrink-0">
                View all <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Link>
            </div>

            {categoryVendors.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-8 sm:p-12 text-center">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 text-muted-foreground/40" />
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                  No professionals in this category yet.
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Check back soon, or <Link href="/signup" className="text-primary hover:underline">be the first</Link> to list your business.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {categoryVendors.slice(0, 8).map((vendor: Vendor, i: number) => (
                  <motion.div
                    key={vendor.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <BusinessCard vendor={vendor} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works — dual audience ─────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 border-y bg-gradient-to-br from-muted/30 via-background to-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">How Casa Corona works</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">Whether you're looking for a service or offering one, we've made it simple.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* For customers */}
            <div className="relative bg-card rounded-2xl border p-6 md:p-8 overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">For Customers</p>
                    <h3 className="font-serif font-bold text-lg">Find & Book</h3>
                  </div>
                </div>
                <div className="space-y-5">
                  {[
                    { step: "01", title: "Browse by niche or location", desc: "Search across 18+ categories — beauty, photography, events, fitness and more. Filter by state or just scroll the feed." },
                    { step: "02", title: "Explore their portfolio", desc: "See real work from the professional before you commit. Read verified reviews from past clients." },
                    { step: "03", title: "Connect & book directly", desc: "Message via the platform, WhatsApp, or request a booking. No middlemen. Pay and confirm on your terms." },
                  ].map(item => (
                    <div key={item.step} className="flex gap-4">
                      <span className="text-xs font-bold text-primary/60 mt-0.5 shrink-0 w-6 tabular-nums">{item.step}</span>
                      <div>
                        <p className="font-semibold text-sm mb-0.5">{item.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full rounded-full mt-6 h-11 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 shadow-md shadow-primary/20" asChild>
                  <Link href="/browse">Explore Now</Link>
                </Button>
              </div>
            </div>

            {/* For vendors */}
            <div className="relative bg-card rounded-2xl border p-6 md:p-8 overflow-hidden group hover:border-accent/30 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-amber-600 flex items-center justify-center shrink-0 shadow-md shadow-accent/20">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">For Professionals</p>
                    <h3 className="font-serif font-bold text-lg">List & Grow</h3>
                  </div>
                </div>
                <div className="space-y-5">
                  {[
                    { step: "01", title: "Create your business profile", desc: "Sign up and build your profile in minutes. Add your services, pricing, portfolio photos, and business details." },
                    { step: "02", title: "Showcase your work", desc: "Upload portfolio shots that appear in the community feed. Get discovered by clients actively looking for your niche." },
                    { step: "03", title: "Get bookings & grow", desc: "Receive enquiries, manage messages, track analytics, and build a loyal client base — all from your dashboard." },
                  ].map(item => (
                    <div key={item.step} className="flex gap-4">
                      <span className="text-xs font-bold text-accent/60 mt-0.5 shrink-0 w-6 tabular-nums">{item.step}</span>
                      <div>
                        <p className="font-semibold text-sm mb-0.5">{item.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full rounded-full mt-6 h-11 border-2 hover:bg-accent/5 hover:border-accent" asChild>
                  <Link href="/signup">List Your Business</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Rotating professionals section ──────────────────────────────── */}
      <section className="py-12 sm:py-16 px-3 sm:px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/10 to-background" />
        <div className="max-w-7xl mx-auto">

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold mb-1">
                {PRO_TABS[proTab].emoji} {PRO_TABS[proTab].label}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Discover talented professionals across Nigeria</p>
            </div>
            <Link href="/browse" className="hidden sm:flex items-center gap-1 text-xs sm:text-sm text-primary font-medium hover:underline shrink-0">
              View all <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>

          {/* Tab pills */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-2 mb-4 sm:mb-6">
            {PRO_TABS.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => switchTab(i)}
                className={cn(
                  "shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border transition-all",
                  proTab === i
                    ? "bg-gradient-to-r from-primary to-emerald-600 text-white border-primary shadow-md shadow-primary/20"
                    : "bg-background text-foreground/70 border-border hover:border-primary/40 hover:text-primary"
                )}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full h-0.5 bg-muted rounded-full mb-4 sm:mb-6 overflow-hidden">
            <motion.div
              key={proTab}
              className="h-full bg-gradient-to-r from-primary to-emerald-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 8, ease: "linear" }}
            />
          </div>

          {/* Cards grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={proTab}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -30 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
            >
              {activeVendors.map((vendor: Vendor, i: number) => (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <BusinessCard vendor={vendor} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 mt-4 sm:mt-6">
            {PRO_TABS.map((tab, i) => (
              <button
                key={i}
                onClick={() => switchTab(i)}
                aria-label={`Switch to ${tab.label} tab`}
                className={cn(
                  "rounded-full transition-all",
                  proTab === i ? "w-6 h-2 bg-gradient-to-r from-primary to-emerald-600" : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                )}
              />
            ))}
          </div>

        </div>
      </section>

      {/* ── Stats with gradient cards ──────────────────────────────────── */}
      <section className="py-10 sm:py-14 px-3 sm:px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
          {[
            { value: `${categories.length}`, label: "Categories", gradient: "from-primary/10 via-emerald-500/5 to-transparent", icon: Sparkles, iconColor: "text-primary" },
            { value: "36", label: "States Covered", gradient: "from-amber-500/10 via-accent/5 to-transparent", icon: Globe, iconColor: "text-amber-500" },
            { value: `100+`, label: "Professionals", gradient: "from-blue-500/10 via-indigo-500/5 to-transparent", icon: Users, iconColor: "text-blue-500" },
            { value: "4.8★", label: "Average Rating", gradient: "from-pink-500/10 via-rose-500/5 to-transparent", icon: Star, iconColor: "text-amber-500" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={cn(
                  "relative rounded-xl sm:rounded-2xl border border-border/60 p-4 sm:p-6 overflow-hidden group hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br backdrop-blur-sm shadow-sm hover:shadow-md",
                  stat.gradient
                )}
              >
                <div className={cn("absolute top-2 right-2 sm:top-3 sm:right-3 opacity-25 group-hover:opacity-50 group-hover:scale-110 transition-all duration-300", stat.iconColor)}>
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mb-0.5 sm:mb-1">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                {/* Bottom accent line on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Why Casa Corona ──────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">Why professionals choose us</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">Built specifically for the Nigerian market — not a one-size-fits-all global tool.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Globe, title: "National reach", desc: "Reach clients across all 36 states and the FCT. Your profile is visible to everyone on the platform — not locked to one city." },
              { icon: ShieldCheck, title: "Verified profiles", desc: "We verify business identities so clients trust who they're booking. Verified badges build credibility instantly." },
              { icon: Users, title: "Real community", desc: "Follow other professionals, get inspired, and build a following. Clients can save your profile and come back." },
              { icon: BarChart3, title: "Built-in analytics", desc: "See how many people viewed your profile, which services get attention, and how your business is growing over time." },
              { icon: MessageCircle, title: "Direct messaging", desc: "Communicate with clients directly through the platform. No phone calls until you're ready." },
              { icon: Zap, title: "Quick to set up", desc: "Your business profile can be live in under 10 minutes. Add services, portfolio photos, and pricing in one go." },
            ].map(({ icon: Icon, title, desc }, idx) => (
              <div
                key={title}
                className="relative p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group overflow-hidden"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Hover gradient wash */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/20 transition-all duration-300 ring-1 ring-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1.5 text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA with brand gradient + glassmorphism ────────────────────── */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-aurora">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-20 -left-20 w-[450px] h-[450px] rounded-full bg-accent/40 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-[450px] h-[450px] rounded-full bg-primary/40 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Ready to join the community?</h2>
          <p className="text-base opacity-95 mb-8 max-w-xl mx-auto">
            Customers — find exceptional talent across Nigeria. Professionals — get your work in front of thousands of potential clients.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="secondary" className="rounded-full px-8 h-12 text-base bg-emerald-gold !text-white hover:opacity-90 shadow-xl btn-shine" asChild>
              <Link href="/browse">Explore as a Customer</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base border-2 border-white !text-foreground hover:!bg-foreground/10 hover:!border-foreground shadow-xl btn-shine" asChild>
              <Link href="/signup">List Your Business</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}