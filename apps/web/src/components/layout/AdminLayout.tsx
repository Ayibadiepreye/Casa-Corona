import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard, Users, Store, ShoppingBag, TrendingUp,
  Settings, LogOut, Menu, X, ChevronRight, Shield,
  Megaphone, RefreshCcw, History,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/vendors", label: "Vendors", icon: Store },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: ShoppingBag },
  { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/refunds", label: "Refunds", icon: RefreshCcw },
  { href: "/admin/audit-log", label: "Audit Log", icon: History },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Role-based route protection
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      // Not logged in - redirect to login
      setLocation("/login");
      return;
    }

    if (user.role !== "admin" && user.role !== "super_admin" && user.role !== "moderator") {
      // Not an admin - redirect to appropriate dashboard
      if (user.role === "vendor") {
        setLocation("/vendor/dashboard");
      } else {
        setLocation("/account");
      }
    }
  }, [user, loading, setLocation]);

  const handleSignOut = () => {
    signOut();
    setLocation("/");
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`flex flex-col h-full bg-card border-r shrink-0 transition-all duration-300 ${!mobile && collapsed ? "w-16" : "w-64"}`}>
      <div className={`p-4 border-b flex items-center ${collapsed && !mobile ? "justify-center" : "justify-between"}`}>
        {(!collapsed || mobile) && (
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Casa Corona" className="h-10 w-10 object-contain" />
            <span className="font-serif font-bold text-lg tracking-tight">Casa Corona</span>
          </Link>
        )}
        {collapsed && !mobile && (
          <Link href="/" className="flex items-center justify-center">
            <img src="/logo.png" alt="Casa Corona" className="h-9 w-9 object-contain" />
          </Link>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(p => !p)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground ml-auto"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <X size={16} />}
          </button>
        )}
      </div>

      {(!collapsed || mobile) && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {initials(user?.name ?? "A")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{user?.name ?? "Admin"}</p>
              <span className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive rounded-full px-2 py-0.5 font-medium">
                <Shield size={9} />
                Admin
              </span>
            </div>
          </div>
        </div>
      )}

      {collapsed && !mobile && (
        <div className="flex justify-center py-3 border-b">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials(user?.name ?? "A")}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed && !mobile ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                collapsed && !mobile ? "justify-center px-2" : ""
              } ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={17} className="shrink-0" />
              {(!collapsed || mobile) && (
                <>
                  {label}
                  {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`p-3 border-t space-y-1 ${collapsed && !mobile ? "flex flex-col items-center" : ""}`}>
        {(!collapsed || mobile) && (
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        )}
        {collapsed && !mobile && <ThemeToggle />}
        <button
          onClick={handleSignOut}
          title={collapsed && !mobile ? "Sign Out" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all w-full ${collapsed && !mobile ? "justify-center px-2" : ""}`}
        >
          <LogOut size={17} className="shrink-0" />
          {(!collapsed || mobile) && "Sign Out"}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 md:hidden"
          >
            <Sidebar mobile />
          </motion.div>
        )}
      </AnimatePresence>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 h-16 border-b bg-background/90 backdrop-blur shrink-0">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-muted">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="font-serif font-bold text-lg">Admin Panel</span>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {initials(user?.name ?? "A")}
            </AvatarFallback>
          </Avatar>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
