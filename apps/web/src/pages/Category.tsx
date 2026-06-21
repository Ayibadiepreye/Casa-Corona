import { useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { BusinessCard } from "@/components/BusinessCard";
import { LayoutGrid, List as ListIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { categoryApi } from "@/lib/api-client";
import type { CategoryDetail } from "@/lib/api-client";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-64 bg-muted rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

export default function Category() {
  const { slug } = useParams();
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const { data, loading, error } = useApi<CategoryDetail>(
    () => categoryApi.getBySlug(slug ?? ""),
    [slug]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary/5 border-b pt-8 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-12 w-64 bg-muted rounded-xl animate-pulse mb-4" />
            <div className="h-6 w-96 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SkeletonGrid />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-serif font-bold mb-4">Category not found</h1>
        <Button asChild>
          <Link href="/browse">Browse all categories</Link>
        </Button>
      </div>
    );
  }

  const category = data.category;
  // Merge featured + recent, deduplicate by id, featured first
  const seen = new Set<string>();
  const categoryVendors = [...data.featuredVendors, ...data.recentVendors].filter(v => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/5 border-b pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/browse" className="hover:text-foreground transition-colors">Categories</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{category.name}</span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">{category.name}</h1>
            <p className="text-lg text-muted-foreground">
              {category.description
                ? category.description
                : `Discover the best ${category.name.toLowerCase()} professionals in Nigeria. From luxury salons to independent specialists, find exactly what you're looking for.`
              }
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-between items-center border-b">
        <p className="text-muted-foreground font-medium">
          Showing {categoryVendors.length} {categoryVendors.length === 1 ? "result" : "results"}
        </p>

        <div className="flex bg-muted/50 p-1 rounded-full border">
          <button
            className={`p-1.5 rounded-full transition-colors ${layout === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            onClick={() => setLayout("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            className={`p-1.5 rounded-full transition-colors ${layout === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            onClick={() => setLayout("list")}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {categoryVendors.length > 0 ? (
          <div className={`grid gap-6 md:gap-8 ${layout === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"}`}>
            {categoryVendors.map((vendor, index) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <BusinessCard vendor={vendor} layout={layout} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <h3 className="text-2xl font-serif font-bold mb-4">No businesses yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              We're still growing our network of {category.name.toLowerCase()} professionals. Check back soon or list your own business!
            </p>
            <Button asChild>
              <Link href="/signup">List Your Business</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
