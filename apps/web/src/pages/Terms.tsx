import { ScrollArea } from "@/components/ui/scroll-area";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <div className="hidden md:block w-64 shrink-0">
            <div className="sticky top-28 bg-muted/30 p-6 rounded-2xl border">
              <h3 className="font-bold font-serif mb-4">Table of Contents</h3>
              <nav className="space-y-3 text-sm">
                <a href="#acceptance" className="block text-muted-foreground hover:text-primary transition-colors">1. Acceptance of Terms</a>
                <a href="#platform" className="block text-muted-foreground hover:text-primary transition-colors">2. Platform Description</a>
                <a href="#vendor-terms" className="block text-muted-foreground hover:text-primary transition-colors">3. Vendor Terms</a>
                <a href="#customer-terms" className="block text-muted-foreground hover:text-primary transition-colors">4. Customer Terms</a>
                <a href="#payments" className="block text-muted-foreground hover:text-primary transition-colors">5. Payments & Fees</a>
                <a href="#content" className="block text-muted-foreground hover:text-primary transition-colors">6. Content Policy</a>
                <a href="#governing-law" className="block text-muted-foreground hover:text-primary transition-colors">7. Governing Law</a>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 max-w-3xl">
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Terms of Service</h1>
              <p className="text-muted-foreground">Last Updated: October 2023</p>
            </div>

            <div className="prose prose-stone dark:prose-invert max-w-none">
              <p className="lead text-xl text-muted-foreground font-light mb-8">
                Welcome to Casa Corona. By accessing our platform, you agree to be bound by these Terms of Service. Please read them carefully.
              </p>

              <section id="acceptance" className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-serif font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground mb-4">
                  By accessing or using the Casa Corona platform (the "Platform"), you agree to comply with and be bound by these Terms. If you do not agree to these Terms, please do not use the Platform.
                </p>
              </section>

              <section id="platform" className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-serif font-bold mb-4">2. Platform Description</h2>
                <p className="text-muted-foreground mb-4">
                  Casa Corona operates as a digital marketplace connecting individuals seeking self-care services ("Customers") with independent professionals and businesses providing such services ("Vendors") in Nigeria. We are a platform provider and do not directly provide self-care services.
                </p>
              </section>

              <section id="vendor-terms" className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-serif font-bold mb-4">3. Vendor Terms</h2>
                <p className="text-muted-foreground mb-4">
                  Vendors must be legally permitted to operate in Nigeria. You agree to provide accurate information regarding your services, pricing, and qualifications. Casa Corona reserves the right to verify business registration and premises before granting "Verified" status.
                </p>
              </section>

              <section id="customer-terms" className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-serif font-bold mb-4">4. Customer Terms</h2>
                <p className="text-muted-foreground mb-4">
                  Customers agree to use the platform in good faith. You must honor appointments booked through or discovered via Casa Corona. Any disputes regarding service quality should be addressed directly with the Vendor, though serious violations may be reported to our support team.
                </p>
              </section>

              <section id="payments" className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-serif font-bold mb-4">5. Payments & Fees</h2>
                <p className="text-muted-foreground mb-4">
                  All prices are listed in Nigerian Naira (₦). Currently, Casa Corona does not process payments directly for services. Payments are settled between the Customer and Vendor. Vendors may be subject to listing or subscription fees as outlined in their specific Vendor Agreement.
                </p>
              </section>

              <section id="content" className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-serif font-bold mb-4">6. Content Policy</h2>
                <p className="text-muted-foreground mb-4">
                  Users are responsible for the content they post, including reviews and portfolio images. Content must not be defamatory, explicit, or infringe on intellectual property rights. Casa Corona reserves the right to remove any content that violates these guidelines.
                </p>
              </section>

              <section id="governing-law" className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-serif font-bold mb-4">7. Governing Law</h2>
                <p className="text-muted-foreground mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Lagos, Nigeria.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
