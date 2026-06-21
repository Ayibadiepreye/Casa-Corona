import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, LayoutDashboard, LogOut, Store } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIsOpen(false); }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = () => {
    signOut();
    setDropdownOpen(false);
    setLocation("/");
  };

  const dashboardHref = user?.role === "vendor" ? "/vendor/dashboard" : user?.role === "admin" ? "/admin" : "/account";

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-background/90 backdrop-blur-md border-b shadow-sm" : "bg-background/60 backdrop-blur-sm"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Casa Corona" className="h-11 w-11 object-contain" />
              <span className="font-serif font-bold text-2xl tracking-tight text-foreground">Casa Corona</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/browse" className={`text-sm font-medium transition-colors ${location === "/browse" ? "text-primary" : "text-foreground/70 hover:text-primary"}`}>Explore</Link>
              <Link href="/browse?tab=professionals" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">Professionals</Link>
              <Link href="/about" className={`text-sm font-medium transition-colors ${location === "/about" ? "text-primary" : "text-foreground/70 hover:text-primary"}`}>About</Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(p => !p)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border hover:bg-muted/50 transition-all"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-card border rounded-2xl shadow-xl overflow-hidden z-[60]"
                    >
                      <div className="px-4 py-3 border-b">
                        <p className="font-semibold text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <span className="inline-flex text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium mt-1 capitalize">
                          {user.role}
                        </span>
                      </div>
                      <div className="p-1.5">
                        <Link
                          href={dashboardHref}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-muted transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <LayoutDashboard size={15} className="text-muted-foreground" />
                          Dashboard
                        </Link>
                        {user.role === "vendor" && (
                          <Link
                            href="/browse"
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-muted transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Store size={15} className="text-muted-foreground" />
                            Browse Marketplace
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-destructive/10 hover:text-destructive transition-colors w-full text-left"
                        >
                          <LogOut size={15} className="text-muted-foreground" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
                  Log in
                </Link>
                <Button asChild className="rounded-full px-5 h-9 text-sm">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
            <button className="text-foreground p-2" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              {user && (
                <div className="flex items-center gap-3 px-3 py-3 border-b mb-2">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col space-y-1">
                <Link href="/browse" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium rounded-xl hover:bg-muted">Explore</Link>
                <Link href="/browse" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium rounded-xl hover:bg-muted">Professionals</Link>
                <Link href="/about" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium rounded-xl hover:bg-muted">About</Link>
                <Link href="/contact" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium rounded-xl hover:bg-muted">Contact</Link>
                {user ? (
                  <>
                    <Link href={dashboardHref} onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium rounded-xl hover:bg-muted">Dashboard</Link>
                    <button onClick={handleSignOut} className="block text-left px-3 py-2 text-base font-medium rounded-xl hover:bg-destructive/10 hover:text-destructive w-full">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium rounded-xl hover:bg-muted">Log in</Link>
                )}
              </div>
              {!user && (
                <Button asChild className="w-full rounded-full">
                  <Link href="/signup">Get Started</Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
