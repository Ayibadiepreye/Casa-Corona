import { Link } from "wouter";
import { Mail, Phone, MapPin, Heart, Send } from "lucide-react";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      
      if (response.ok) {
        setSubscribed(true);
        setEmail("");
      }
    } catch (error) {
      console.error("Newsletter subscription failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="relative overflow-hidden border-t bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Decorative gradient orbs (subtle in light mode, more visible in dark) */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary/10 dark:bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-accent/15 dark:bg-accent/25 blur-3xl" />
      </div>

      {/* Decorative top divider with gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* ── Top: brand col + 3 link cols ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14">

          {/* Brand column */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <img src="/logo.png" alt="Casa Corona" className="h-11 w-11 object-contain" />
              <span className="font-serif font-bold text-2xl tracking-tight">
                <span className="text-foreground">Casa</span>{" "}
                <span className="bg-gradient-to-r from-accent to-amber-600 bg-clip-text text-transparent">Corona</span>
              </span>
            </Link>

            <p className="text-sm mb-6 max-w-xs leading-relaxed text-muted-foreground">
              Nigeria's premium digital marketplace connecting you with the finest self-care businesses.
            </p>

            {/* Contact info */}
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0 text-primary" /> hello@casacorona.org
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0 text-primary" /> +234 800 CASA
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 text-primary" /> Port Harcourt, Nigeria
              </li>
            </ul>
          </div>

          {/* Discover */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-widest mb-5 text-foreground">Discover</h4>
            <ul className="space-y-3">
              {[
                { label: "All Businesses", href: "/browse" },
                { label: "Hair Salons", href: "/category/beauty-hair" },
                { label: "Spas & Wellness", href: "/category/skincare-spa" },
                { label: "Makeup Artists", href: "/category/makeup-artistry" },
                { label: "Barbershops", href: "/browse" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-widest mb-5 text-foreground">Company</h4>
            <ul className="space-y-3">
              {[
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "FAQ", href: "/faq" },
                { label: "List Your Business", href: "/signup" },
                { label: "Blog", href: "#" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-widest mb-5 text-foreground">Stay in the loop</h4>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              New vendors, exclusive offers, and self-care tips — straight to your inbox.
            </p>
            <form
              onSubmit={handleSubscribe}
              className="relative"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSubscribed(false); }}
                placeholder="you@example.com"
                required
                disabled={submitting}
                className="w-full h-11 pl-4 pr-12 rounded-full bg-background border-2 border-border focus:border-primary focus:outline-none text-sm transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                disabled={submitting}
                className="absolute right-1 top-1 h-9 w-9 rounded-full bg-gradient-to-br from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white flex items-center justify-center shadow-md shadow-primary/20 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            {subscribed && (
              <p className="text-xs text-primary mt-2 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-primary" /> Thanks! Check your inbox.
              </p>
            )}
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────────── */}
        <div className="pt-8 border-t border-border/60 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground order-2 md:order-1">
            © {new Date().getFullYear()}{" "}
            <span className="font-semibold text-foreground">Casa</span>
            <span className="font-semibold bg-gradient-to-r from-accent to-amber-600 bg-clip-text text-transparent">Corona</span>
            . All rights reserved.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-2 order-1 md:order-2">
            <a
              href="#"
              aria-label="Twitter"
              className="w-9 h-9 rounded-full flex items-center justify-center border border-border/60 text-muted-foreground hover:text-primary hover:border-primary transition-all hover:scale-110"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
              </svg>
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full flex items-center justify-center border border-border/60 text-muted-foreground hover:text-primary hover:border-primary transition-all hover:scale-110"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="w-9 h-9 rounded-full flex items-center justify-center border border-border/60 text-muted-foreground hover:text-primary hover:border-primary transition-all hover:scale-110"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a
              href="#"
              aria-label="TikTok"
              className="w-9 h-9 rounded-full flex items-center justify-center border border-border/60 text-muted-foreground hover:text-primary hover:border-primary transition-all hover:scale-110"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>
              </svg>
            </a>
          </div>

          {/* Made with care */}
          <p className="text-sm text-muted-foreground order-3 flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 fill-accent text-accent" /> in Nigeria
          </p>
        </div>

      </div>
    </footer>
  );
}