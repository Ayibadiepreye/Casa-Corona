import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { formatNaira } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingModal } from "@/components/BookingModal";
import {
  MapPin, Star, Award, CheckCircle, Clock, Users,
  Phone, Mail, Share2, MessageCircle, Heart, ChevronRight, CalendarDays, Send
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { vendorApi, reviewApi, conversationApi, savedApi, followApi, VendorService, VendorReview } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

// ── Review form ─────────────────────────────────────────────────────────────
function ReviewForm({ vendorId, onSubmitted }: { vendorId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (submitting) return;
    if (!vendorId) return; // never POST to /vendors//reviews
    setSubmitting(true);
    try {
      await reviewApi.create(vendorId, { rating, content: comment.trim() || undefined });
      toast({ title: "Review posted", description: "Thanks for your feedback!" });
      setComment("");
      setRating(5);
      onSubmitted();
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message ?? e?.message ?? "Failed to post review";
      toast({ title: "Couldn't post review", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className="p-0.5 hover:scale-110 transition-transform"
            aria-label={`Rate ${n} stars`}
          >
            <Star className={`w-7 h-7 ${n <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted"}`} />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Tell others about your experience (optional)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={3}
        maxLength={500}
      />
      <Button onClick={submit} disabled={submitting} className="rounded-full w-full sm:w-auto">
        <Send className="w-4 h-4 mr-1.5" />
        {submitting ? "Posting…" : "Post review"}
      </Button>
    </div>
  );
}

// Adapter: map real VendorService to what BookingModal expects
function toModalService(s: VendorService) {
  return {
    id: s.id as unknown as number, // BookingModal uses number id but only for key comparison
    name: s.name,
    description: s.description ?? "",
    price: s.priceMin,
    duration: s.durationMinutes
      ? s.durationMinutes >= 60
        ? `${Math.floor(s.durationMinutes / 60)}h${s.durationMinutes % 60 > 0 ? ` ${s.durationMinutes % 60}m` : ""}`
        : `${s.durationMinutes}m`
      : "",
  };
}

function SkeletonVendor() {
  return (
    <div className="bg-background min-h-screen animate-pulse">
      <div className="h-64 md:h-80 w-full bg-muted" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24 md:-mt-32">
        <div className="bg-background border shadow-lg rounded-2xl p-6 md:p-8 h-48" />
      </div>
    </div>
  );
}

export default function Vendor() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState<ReturnType<typeof toModalService> | null>(null);
  const [saved, setSaved] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Detect initial saved/followed state from the user's saved+follows lists.
  // Cheap: two parallel calls only when we know the userId.
  const { data: savedList } = useApi(
    () => (user ? savedApi.list() : Promise.resolve({ saved: [], total: 0, page: 1, pages: 0 })),
    [user?.id]
  );
  const { data: followedList } = useApi(
    () => (user ? followApi.list() : Promise.resolve({ follows: [], total: 0, page: 1, pages: 0 })),
    [user?.id]
  );

  const { data: vendor, loading, error, refetch: refetchVendor } = useApi(
    () => vendorApi.getBySlug(slug ?? ""),
    [slug]
  );

  const { data: reviewsData, refetch: refetchReviews } = useApi<VendorReview[] | { reviews?: VendorReview[] }>(
    async () => {
      if (!vendor?.id) return [] as VendorReview[];
      const res = (await reviewApi.listForVendor(vendor.id)) as any;
      // API may return either {reviews: [...]} or a bare array
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.reviews)) return res.reviews;
      return [] as VendorReview[];
    },
    [vendor?.id]
  );
  const reviews: VendorReview[] = Array.isArray(reviewsData)
    ? reviewsData
    : (reviewsData as any)?.reviews ?? [];

  // Sync saved/followed state from the user's lists. Must be declared AFTER
    // `vendor` so the closure can read it.
    useEffect(() => {
      if (!vendor) return;
      // Fire-and-forget analytics: log a view of this vendor profile.
      // We only track once per page-mount per session, not on every refetch.
      vendorApi.trackView(vendor.id);
      setSaved(!!savedList?.saved?.some(v => v.id === vendor.id));
      setFollowed(!!followedList?.follows?.some(v => v.id === vendor.id));
    }, [vendor?.id]);

  if (loading) return <SkeletonVendor />;

  if (error || !vendor) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-serif font-bold mb-4">Vendor not found</h1>
        <Button asChild><Link href="/browse">Back to Browse</Link></Button>
      </div>
    );
  }

  const services = vendor.services ?? [];
  const portfolio = vendor.portfolioShots ?? [];
  const minPrice = services.length > 0 ? Math.min(...services.map(s => s.priceMin)) : 0;

  const openBooking = (service?: VendorService) => {
    setPreSelectedService(service ? toModalService(service) : null);
    setBookingOpen(true);
  };

  const handleSaveToggle = async () => {
    try {
      if (saved) {
        await vendorApi.unsave(vendor.id);
      } else {
        await vendorApi.save(vendor.id);
      }
      setSaved(s => !s);
    } catch {
      setSaved(s => !s); // optimistic fallback
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (followed) {
        await vendorApi.unfollow(vendor.id);
      } else {
        await vendorApi.follow(vendor.id);
      }
      setFollowed(f => !f);
    } catch {
      setFollowed(f => !f); // optimistic fallback
    }
  };

  const handleMessage = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to message this vendor.", variant: "destructive" });
      setLocation("/login");
      return;
    }
    if (user.id === vendor.userId) {
      toast({ title: "That's you", description: "You can't message your own business.", variant: "destructive" });
      return;
    }
    setMessaging(true);
    try {
      const result = await conversationApi.findOrCreate(vendor.id);
      setLocation(`/messages/${result.conversation.id}`);
    } catch (e: any) {
      toast({ title: "Couldn't start chat", description: e?.message ?? "Try again", variant: "destructive" });
    } finally {
      setMessaging(false);
    }
  };

  const mapLink = `https://maps.google.com/?q=${encodeURIComponent(`${vendor.city}, ${vendor.state}, Nigeria`)}`;

  // BookingModal vendor shape adapter
  const modalVendor = {
    id: vendor.id,
    name: vendor.businessName,
    logo: vendor.logoUrl ?? "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200",
    city: vendor.city,
    state: vendor.state,
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Cover Image */}
      <div className="h-64 md:h-80 w-full relative">
        <img
          src={vendor.coverUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1600"}
          alt={vendor.businessName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent md:via-background/40 md:to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24 md:-mt-32">
        {/* Breadcrumb with back button on mobile */}
        <div className="flex items-center gap-2 text-sm mb-4 sm:mb-6">
          <button 
            onClick={() => window.history.back()} 
            className="md:hidden flex items-center gap-1 text-foreground/80 hover:text-primary transition-colors bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back
          </button>
          <div className="hidden md:flex items-center gap-2 text-white/80 drop-shadow-md">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/browse" className="hover:text-white transition-colors">Vendors</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-white">{vendor.businessName}</span>
          </div>
        </div>

        {/* Profile Header - Fully Adaptive Mobile */}
        <div className="bg-background/80 backdrop-blur-xl border shadow-lg rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-start relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-background overflow-hidden shrink-0 shadow-sm bg-background">
            <img
              src={vendor.logoUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200"}
              alt={vendor.businessName}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 w-full min-w-0">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-2">
                  {vendor.category && (
                    <Badge variant="secondary" className="uppercase tracking-wider text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-semibold rounded-sm bg-primary/10 text-primary hover:bg-primary/20 px-1.5 py-0.5">
                      {vendor.category.name}
                    </Badge>
                  )}
                  {vendor.featured && (
                    <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20 text-[8px] xs:text-[9px] sm:text-xs px-1.5 py-0.5">
                      <Award className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" /> Featured
                    </Badge>
                  )}
                  {vendor.verified && (
                    <Badge variant="outline" className="border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/5 text-[8px] xs:text-[9px] sm:text-xs px-1.5 py-0.5">
                      <CheckCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" /> Verified
                    </Badge>
                  )}
                </div>

                <h1 className="text-xl xs:text-[22px] sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-foreground mb-1 sm:mb-1.5 md:mb-2 break-words leading-tight">
                  {vendor.businessName}
                </h1>
                {vendor.user?.name && (
                  <p className="text-xs xs:text-sm sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">By {vendor.user.name}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 sm:gap-2 md:gap-4 text-xs xs:text-sm sm:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /><span className="truncate">{vendor.city}, {vendor.state}</span></span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-500 text-yellow-500 shrink-0" />
                    <span className="font-semibold text-foreground">{vendor.averageRating?.toFixed(1) ?? "0.0"}</span>
                    <span className="hidden xs:inline">({vendor.reviewCount} reviews)</span>
                    <span className="xs:hidden">({vendor.reviewCount})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="rounded-full shrink-0 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 border" 
                  onClick={() => navigator.share?.({ title: vendor.businessName, url: window.location.href }).catch(() => {})}
                  title="Share"
                >
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className={`rounded-full shrink-0 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 border transition-colors ${saved ? "border-red-400 text-red-500 bg-red-50 dark:bg-red-950/20" : ""}`}
                  onClick={handleSaveToggle}
                  title={saved ? "Remove from saved" : "Save vendor"}
                >
                  <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all ${saved ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className={`rounded-full shrink-0 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 border transition-colors ${followed ? "border-primary text-primary bg-primary/10" : ""}`}
                  onClick={handleFollowToggle}
                  title={followed ? "Unfollow" : "Follow"}
                >
                  <Users className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all ${followed ? "fill-primary/30" : ""}`} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full flex-1 md:flex-none gap-1 sm:gap-1.5 min-w-[75px] h-8 sm:h-9 md:h-10 text-xs xs:text-sm sm:text-sm px-2.5 sm:px-3 md:px-4 whitespace-nowrap"
                  onClick={handleMessage}
                  disabled={messaging}
                >
                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{messaging ? "..." : "Message"}</span>
                </Button>
                <Button 
                  className="rounded-full flex-1 md:flex-none gap-1 sm:gap-1.5 min-w-[75px] h-8 sm:h-9 md:h-10 text-xs xs:text-sm sm:text-sm px-2.5 sm:px-3 md:px-4 whitespace-nowrap font-semibold" 
                  onClick={() => openBooking()}
                >
                  <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Book Now</span>
                </Button>
              </div>
            </div>

            <p className="text-muted-foreground text-xs xs:text-sm sm:text-sm leading-relaxed break-words">{vendor.description}</p>
          </div>
        </div>

        {/* Content Tabs - Mobile Responsive */}
        <div className="mt-6 sm:mt-8 mb-24 sm:mb-32 md:mb-16">
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-10 sm:h-12 p-0 gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden no-scrollbar">
              <TabsTrigger value="services" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 sm:pb-3 pt-2 font-medium text-sm sm:text-base whitespace-nowrap">Services</TabsTrigger>
              <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 sm:pb-3 pt-2 font-medium text-sm sm:text-base whitespace-nowrap">About</TabsTrigger>
              <TabsTrigger value="portfolio" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 sm:pb-3 pt-2 font-medium text-sm sm:text-base whitespace-nowrap">Portfolio</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 sm:pb-3 pt-2 font-medium text-sm sm:text-base whitespace-nowrap">Reviews</TabsTrigger>
              <TabsTrigger value="location" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 sm:pb-3 pt-2 font-medium text-sm sm:text-base whitespace-nowrap">Location</TabsTrigger>
            </TabsList>

            <div className="py-8">
              {/* Services Tab */}
              <TabsContent value="services" className="m-0 focus-visible:outline-none">
                {services.length > 0 ? (
                  <div className="grid gap-4 md:gap-5">
                    {services.map((service) => (
                      <div key={service.id} className="bg-card border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">{service.name}</h3>
                            <p className="text-muted-foreground text-sm max-w-xl">{service.description}</p>
                            {service.durationMinutes && (
                              <div className="flex items-center gap-2 mt-3 text-sm font-medium text-muted-foreground">
                                <Clock className="w-4 h-4 text-primary" />
                                {service.durationMinutes >= 60
                                  ? `${Math.floor(service.durationMinutes / 60)}h${service.durationMinutes % 60 > 0 ? ` ${service.durationMinutes % 60}m` : ""}`
                                  : `${service.durationMinutes}m`}
                              </div>
                            )}
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 shrink-0">
                            <span className="text-2xl font-bold font-serif text-foreground">
                              {formatNaira(service.priceMin)}
                              {service.priceMax && service.priceMax !== service.priceMin && (
                                <span className="text-base font-normal text-muted-foreground"> – {formatNaira(service.priceMax)}</span>
                              )}
                            </span>
                            <Button size="sm" className="rounded-full px-5" onClick={() => openBooking(service)}>
                              Book
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>No services listed yet.</p>
                  </div>
                )}
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="m-0 focus-visible:outline-none space-y-8">
                <div>
                  <h3 className="text-xl font-serif font-bold mb-4">About {vendor.businessName}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {vendor.description || "No description provided yet."}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {vendor.openingHours && (
                    <div className="bg-muted/30 p-6 rounded-xl border">
                      <h4 className="font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Opening Hours</h4>
                      <ul className="space-y-2 text-sm">
                        {Object.entries(vendor.openingHours).map(([day, hours]) => (
                          <li key={day} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">{day}</span>
                            <span className="font-medium">{hours as string}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-muted/30 p-6 rounded-xl border">
                    <h4 className="font-bold mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Contact</h4>
                    <ul className="space-y-4 text-sm">
                      {vendor.phone && (
                        <li className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border shrink-0"><Phone className="w-3.5 h-3.5" /></div>
                          <span>{vendor.phone}</span>
                        </li>
                      )}
                      {vendor.whatsapp && (
                        <li className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border shrink-0"><MessageCircle className="w-3.5 h-3.5" /></div>
                          <a href={`https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                            WhatsApp: {vendor.whatsapp}
                          </a>
                        </li>
                      )}
                      {vendor.website && (
                        <li className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border shrink-0"><Mail className="w-3.5 h-3.5" /></div>
                          <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors truncate">{vendor.website}</a>
                        </li>
                      )}
                      {!vendor.phone && !vendor.whatsapp && !vendor.website && (
                        <li className="text-muted-foreground">No contact info provided.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio" className="m-0 focus-visible:outline-none">
                {portfolio.length > 0 ? (
                  <div className="columns-2 md:columns-3 gap-4 space-y-4">
                    {portfolio.map((item) => (
                      <div key={item.id} className="break-inside-avoid rounded-xl overflow-hidden bg-muted group cursor-pointer">
                        <img
                          src={item.imageUrl}
                          alt={item.caption || "Portfolio item"}
                          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {item.caption && (
                          <p className="text-xs text-muted-foreground px-2 py-1.5">{item.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>No portfolio items yet.</p>
                  </div>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="m-0 focus-visible:outline-none">
                <div className="flex flex-col md:flex-row gap-8 mb-10 p-6 bg-muted/20 border rounded-2xl">
                  <div className="text-center md:text-left flex flex-col items-center md:items-start justify-center min-w-[200px]">
                    <div className="text-5xl font-serif font-bold text-foreground mb-2">
                      {vendor.averageRating?.toFixed(1) ?? "0.0"}
                    </div>
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-5 h-5 ${s <= Math.floor(vendor.averageRating ?? 0) ? "fill-yellow-500 text-yellow-500" : "text-muted"}`} />
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">Based on {vendor.reviewCount} reviews</div>
                  </div>

                  {/* Write a review */}
                  {user && user.id !== vendor.userId && (
                    <div className="flex-1 border-l-0 md:border-l md:pl-8 pt-6 md:pt-0">
                      <h3 className="font-semibold mb-3">Write a review</h3>
                      <ReviewForm
                        vendorId={vendor.id}
                        onSubmitted={() => {
                          refetchReviews();
                          refetchVendor();
                        }}
                      />
                    </div>
                  )}
                  {!user && (
                    <div className="flex-1 border-l-0 md:border-l md:pl-8 pt-6 md:pt-0">
                      <p className="text-sm text-muted-foreground mb-3">Sign in to leave a review.</p>
                      <Button asChild className="rounded-full" variant="outline">
                        <Link href="/login">Sign in</Link>
                      </Button>
                    </div>
                  )}
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-6 last:border-0">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            {review.user?.avatarUrl ? (
                              <img
                                src={review.user.avatarUrl}
                                alt={review.user.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center text-sm shrink-0">
                                {review.user?.name?.[0]?.toUpperCase() ?? "U"}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-sm">{review.user?.name ?? "Verified Customer"}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted"}`} />
                            ))}
                          </div>
                        </div>
                        {(review.content || review.comment) && (
                          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{review.content || review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>No reviews yet. Be the first to review!</p>
                  </div>
                )}
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location" className="m-0 focus-visible:outline-none">
                <div className="bg-muted rounded-2xl h-80 flex items-center justify-center border border-dashed mb-6 relative overflow-hidden">
                  <div className="bg-background/90 backdrop-blur p-4 rounded-xl shadow-lg flex items-center gap-3 z-10 border">
                    <MapPin className="text-primary w-6 h-6 shrink-0" />
                    <div>
                      <div className="font-bold">{vendor.businessName}</div>
                      <div className="text-sm text-muted-foreground">{vendor.city}, {vendor.state}</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-card border rounded-xl p-4">
                  <div>
                    <h4 className="font-bold text-sm mb-1">Location</h4>
                    <p className="text-muted-foreground text-sm">
                      {vendor.address ? `${vendor.address}, ` : ""}{vendor.city}, {vendor.state}, Nigeria
                    </p>
                  </div>
                  <Button variant="outline" className="rounded-full" asChild>
                    <a href={mapLink} target="_blank" rel="noopener noreferrer">Get Directions</a>
                  </Button>
                </div>

                {/* Business hours */}
                {vendor.hours && typeof vendor.hours === "object" && Object.keys(vendor.hours).length > 0 && (
                  <div className="bg-card border rounded-xl p-4">
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Business Hours
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {Object.entries(vendor.hours as Record<string, string>).map(([day, time]) => (
                        <li key={day} className="flex justify-between text-muted-foreground">
                          <span className="capitalize font-medium text-foreground">
                            {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].includes(day)
                              ? { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" }[day]
                              : day}
                          </span>
                          <span>{time}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Business meta */}
                {(vendor.yearsInBusiness || vendor.teamSize || vendor.priceRange || vendor.serviceArea) && (
                  <div className="bg-card border rounded-xl p-4">
                    <h4 className="font-bold text-sm mb-3">At a glance</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {vendor.yearsInBusiness && (
                        <li className="flex justify-between"><span>Years in business</span><span className="font-medium text-foreground">{vendor.yearsInBusiness}+</span></li>
                      )}
                      {vendor.teamSize && (
                        <li className="flex justify-between"><span>Team size</span><span className="font-medium text-foreground">{vendor.teamSize}</span></li>
                      )}
                      {vendor.priceRange && (
                        <li className="flex justify-between"><span>Price range</span><span className="font-medium text-foreground capitalize">{vendor.priceRange === "low" ? "₦" : vendor.priceRange === "mid" ? "₦₦" : "₦₦₦"}</span></li>
                      )}
                      {vendor.serviceArea && (
                        <li className="flex justify-between gap-3"><span className="shrink-0">Service area</span><span className="font-medium text-foreground text-right">{vendor.serviceArea}</span></li>
                      )}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Sticky Mobile CTA - Adaptive with WhatsApp */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-background/95 backdrop-blur-md border-t px-2 py-2 safe-area-bottom">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-muted-foreground leading-tight">From</p>
            <p className="font-bold font-serif text-sm leading-tight truncate">{minPrice > 0 ? formatNaira(minPrice) : "—"}</p>
          </div>
          
          {/* Message Button */}
          <Button 
            size="sm" 
            variant="outline" 
            className="rounded-full px-2 h-8 shrink-0"
            onClick={handleMessage}
            disabled={messaging}
            title="Message"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          
          {/* WhatsApp Button (if available) */}
          {vendor.whatsapp && (
            <a
              href={`https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'd like to book a service at ${vendor.businessName}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border h-8 w-8 shrink-0 hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
              title="WhatsApp"
            >
              <svg className="w-4 h-4 text-green-600 dark:text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.126 1.521 5.871L0 24l6.335-1.511A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.498-5.254-1.371l-.377-.214-3.762.897.948-3.669-.232-.38A9.935 9.935 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
            </a>
          )}
          
          {/* Book Button */}
          <Button className="rounded-full px-3 gap-1 h-8 text-xs whitespace-nowrap shrink-0 font-semibold" onClick={() => openBooking()}>
            <CalendarDays className="w-3.5 h-3.5" />
            Book
          </Button>
        </div>
      </div>

      {/* Sticky Desktop Booking Bar - Fully Responsive */}
      <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur-md border shadow-xl rounded-full px-3 lg:px-6 py-2 lg:py-3 items-center gap-2 lg:gap-6 max-w-[calc(100vw-2rem)]">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={vendor.logoUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200"}
            alt={vendor.businessName}
            className="w-7 h-7 lg:w-8 lg:h-8 rounded-full object-cover border shrink-0"
          />
          <div className="min-w-0">
            <p className="font-semibold text-xs lg:text-sm leading-tight truncate">{vendor.businessName}</p>
            {minPrice > 0 && <p className="text-[10px] lg:text-xs text-muted-foreground truncate">from {formatNaira(minPrice)}</p>}
          </div>
        </div>
        
        <div className="w-px h-6 lg:h-8 bg-border shrink-0 hidden lg:block" />
        
        <div className="hidden lg:flex items-center gap-1 text-sm shrink-0">
          <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
          <span className="font-semibold text-sm">{vendor.averageRating?.toFixed(1) ?? "0.0"}</span>
          <span className="text-muted-foreground text-xs">({vendor.reviewCount})</span>
        </div>
        
        <div className="w-px h-6 lg:h-8 bg-border shrink-0 hidden lg:block" />
        
        <Button className="rounded-full px-3 lg:px-6 gap-1.5 h-8 lg:h-9 text-xs lg:text-sm shrink-0" onClick={() => openBooking()}>
          <CalendarDays className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          <span className="hidden lg:inline">Book Now</span>
          <span className="lg:hidden">Book</span>
        </Button>
        
        {vendor.whatsapp && (
          <a
            href={`https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'd like to book a service at ${vendor.businessName}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 lg:px-4 h-8 lg:h-9 rounded-full border text-xs lg:text-sm font-medium hover:bg-green-50 hover:border-green-300 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-400 transition-colors shrink-0"
            title="WhatsApp"
          >
            <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-green-600 dark:text-green-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.126 1.521 5.871L0 24l6.335-1.511A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.498-5.254-1.371l-.377-.214-3.762.897.948-3.669-.232-.38A9.935 9.935 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            <span className="hidden xl:inline">WhatsApp</span>
          </a>
        )}
      </div>

      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        vendor={modalVendor}
        services={services.map(toModalService)}
        preSelectedService={preSelectedService}
      />
    </div>
  );
}
