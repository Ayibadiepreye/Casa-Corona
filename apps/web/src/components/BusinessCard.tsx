import { Link } from "wouter";
import { Star, MapPin, CheckCircle, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/utils";
import { Vendor, VendorService } from "@/lib/api-client";

export function BusinessCard({ vendor, services, layout = "grid" }: { vendor: Vendor; services?: VendorService[]; layout?: "grid" | "list" }) {
  const minPrice = services && services.length > 0
    ? Math.min(...services.map(s => s.priceMin))
    : null;

  if (layout === "list") {
    return (
      <Link href={`/vendor/${vendor.slug}`}>
        <Card className="overflow-hidden hover-elevate transition-all duration-300 border-border hover:border-primary/30 group flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-64 shrink-0 aspect-[4/3] sm:aspect-auto">
            <img
              src={vendor.coverUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800"}
              alt={vendor.businessName}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/60 to-transparent" />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {vendor.featured && (
                <Badge className="bg-yellow-500/90 hover:bg-yellow-500 text-yellow-950 border-none font-semibold shadow-sm backdrop-blur-sm">
                  <Award className="w-3 h-3 mr-1" />Featured
                </Badge>
              )}
            </div>
            <div className="absolute -bottom-6 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 right-6 sm:-right-6">
              <div className="w-14 h-14 rounded-full border-4 border-background overflow-hidden bg-background shadow-sm">
                <img src={vendor.logoUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200"} alt={`${vendor.businessName} logo`} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <CardContent className="p-6 pt-8 sm:pt-6 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
              <span className="uppercase tracking-wider">{vendor.category?.name}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{vendor.city}, {vendor.state}</span>
            </div>
            <h3 className="text-xl font-bold font-serif mb-2 line-clamp-1 flex items-center gap-2">
              {vendor.businessName}
              {vendor.verified && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
            </h3>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1 text-sm">
                {vendor.reviewCount > 0 ? (
                  <>
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold">{vendor.averageRating}</span>
                    <span className="text-muted-foreground">({vendor.reviewCount})</span>
                  </>
                ) : (
                  <span className="text-muted-foreground font-medium">New</span>
                )}
              </div>
              {minPrice && (
                <span className="text-sm text-muted-foreground">from <span className="font-semibold text-foreground">{formatNaira(minPrice)}</span></span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/vendor/${vendor.slug}`}>
      <Card className="overflow-hidden h-full hover-elevate transition-all duration-300 border-border hover:border-primary/30 group flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden shrink-0">
          <img
            src={vendor.coverUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800"}
            alt={vendor.businessName}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {vendor.featured && (
              <Badge className="bg-yellow-500/90 hover:bg-yellow-500 text-yellow-950 border-none font-semibold shadow-sm backdrop-blur-sm">
                <Award className="w-3 h-3 mr-1" />Featured
              </Badge>
            )}
          </div>
          <div className="absolute -bottom-6 right-6">
            <div className="w-14 h-14 rounded-full border-4 border-background overflow-hidden bg-background shadow-sm">
              <img src={vendor.logoUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200"} alt={`${vendor.businessName} logo`} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <CardContent className="p-5 pt-8 flex-1 flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
            <span className="uppercase tracking-wider">{vendor.category?.name}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{vendor.city}</span>
          </div>
          <h3 className="text-lg font-bold font-serif mb-2 line-clamp-1 flex items-center gap-2">
            {vendor.businessName}
            {vendor.verified && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
          </h3>
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
            <div className="flex items-center gap-1 text-sm">
              {vendor.reviewCount > 0 ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold text-sm">{vendor.averageRating}</span>
                  <span className="text-muted-foreground text-xs">({vendor.reviewCount})</span>
                </>
              ) : (
                <span className="text-muted-foreground font-medium text-sm">New</span>
              )}
            </div>
            {minPrice && (
              <span className="text-xs text-muted-foreground">from <span className="font-semibold text-foreground text-sm">{formatNaira(minPrice)}</span></span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
