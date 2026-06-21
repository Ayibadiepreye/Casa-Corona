import { ScrollArea } from "@/components/ui/scroll-area";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <div className="hidden md:block w-64 shrink-0">
            <div className="sticky top-28 bg-muted/30 p-6 rounded-2xl border">
              <h3 className="font-bold font-serif mb-4">Privacy Policy</h3>
              <nav className="space-y-3 text-sm">
                <a href="#introduction" className="block text-muted-foreground hover:text-primary transition-colors">1. Introduction</a>
                <a href="#data-collection" className="block text-muted-foreground hover:text-primary transition-colors">2. Data We Collect</a>
                <a href="#data-usage" className="block text-muted-foreground hover:text-primary transition-colors">3. How We Use Data</a>
                <a href="#data-sharing" className="block text-muted-foreground hover:text-primary transition-colors">4. Data Sharing</a>
                <a href="#user-rights" className="block text-muted-foreground hover:text-primary transition-colors">5. Your Rights</a>
                <a href="#ndpa" className="block text-muted-foreground hover:text-primary transition-colors">6. NDPA Compliance</a>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 max-w-3xl">
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground">Effective Date: October 2023</p>
            </div>

            <div className="prose prose-stone dark:prose-invert max-w-none">
              <p className="lead text-xl text-muted-foreground font-light mb-8">
                Casa Corona respects your privacy and is committed to protecting your personal data in accordance with Nigerian law.
              </p>

              <section id="introduction" className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-serif font-bold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground mb-4">
                  This Privacy Policy explains how Casa Corona collects, uses, and protects the personal data of our users (Customers and Vendors).
                </p>
              </section>

              <section id="data-collection" className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-serif font-bold mb-4">2. Data We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We collect information you provide directly to us (such as your name, email, phone number, and location) and data collected automatically (such as IP address, device information, and usage patterns).
                </p>
              </section>

              <section id="data-usage" className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-serif font-bold mb-4">3. How We Use Data</h2>
                <p className="text-muted-foreground mb-4">
                  We use your data to provide and improve our services, facilitate connections between Customers and Vendors, send administrative notifications, and enhance the security of our platform.
                </p>
              </section>

              <section id="data-sharing" className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-serif font-bold mb-4">4. Data Sharing</h2>
                <p className="text-muted-foreground mb-4">
                  We may share limited information between Customers and Vendors to facilitate bookings. We do not sell your personal data to third parties. We may disclose data if required by Nigerian law enforcement.
                </p>
              </section>

              <section id="user-rights" className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-serif font-bold mb-4">5. Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  You have the right to access, correct, or delete your personal data. You may also object to processing or request data portability by contacting our Data Protection Officer at privacy@casacorona.org.
                </p>
              </section>

              <section id="ndpa" className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-serif font-bold mb-4">6. NDPA Compliance</h2>
                <p className="text-muted-foreground mb-4">
                  Our data practices are designed to comply with the Nigeria Data Protection Act (NDPA) 2023. We implement appropriate technical and organizational measures to safeguard your data against unauthorized access.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
