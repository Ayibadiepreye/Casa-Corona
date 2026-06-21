import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="bg-background min-h-screen">
      <div className="bg-primary text-primary-foreground py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">Elevating African Self-Care.</h1>
          <p className="text-xl md:text-2xl opacity-90 font-light max-w-2xl mx-auto">
            We built Casa Corona to give Nigeria's finest beauty and wellness professionals the digital stage they deserve.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-serif font-bold mb-6">What We Are</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Casa Corona is a premium digital marketplace that connects discerning clients with top-tier self-care businesses. From luxury salons in Victoria Island to elite wellness retreats in Abuja, we curate the best.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We are not just a directory; we are a standard of quality. Every business on our platform represents excellence in their craft, professionalism in their service, and passion for their industry.
            </p>
          </div>
          <div className="aspect-square bg-muted rounded-2xl overflow-hidden">
            <img src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=800" alt="Salon interior" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="bg-muted/30 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="aspect-square bg-muted rounded-2xl overflow-hidden order-2 md:order-1">
              <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=800" alt="Spa experience" className="w-full h-full object-cover" />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-serif font-bold mb-6">Why We Exist</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                The African beauty and wellness industry is vibrant, incredibly talented, and growing rapidly. Yet, finding reliable, high-quality services often relies on word-of-mouth.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We created Casa Corona to bridge this gap. For clients, it's a trusted concierge to discover exceptional services. For professionals, it's a sophisticated platform that respects their brand and connects them with high-intent clientele.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-serif font-bold mb-12">Join the Standard</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" className="rounded-full px-8 text-base h-14" asChild>
            <Link href="/browse">Discover Businesses</Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8 text-base h-14" asChild>
            <Link href="/signup">List Your Business</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
