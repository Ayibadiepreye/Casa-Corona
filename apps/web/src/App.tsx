import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { VendorLayout } from "@/components/layout/VendorLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Public Pages
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import Vendor from "@/pages/Vendor";
import Category from "@/pages/Category";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/not-found";

// Auth Pages
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Customer Dashboard
import Account from "@/pages/customer/Account";
import Saved from "@/pages/customer/Saved";
import MyReviews from "@/pages/customer/MyReviews";
import Following from "@/pages/customer/Following";
import Bookings from "@/pages/customer/Bookings";
import History from "@/pages/customer/History";
import Notifications from "@/pages/customer/Notifications";
import CustomerSettings from "@/pages/customer/CustomerSettings";
import CustomerMessages from "@/pages/customer/CustomerMessages";

// Admin Pages
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminVendors from "@/pages/admin/AdminVendors";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminAnnouncements from "@/pages/admin/AdminAnnouncements";
import AdminRefunds from "@/pages/admin/AdminRefunds";
import AdminAuditLog from "@/pages/admin/AdminAuditLog";

// Vendor Dashboard
import VendorDashboard from "@/pages/vendor/VendorDashboard";
import VendorProfile from "@/pages/vendor/VendorProfile";
import VendorServices from "@/pages/vendor/VendorServices";
import VendorProducts from "@/pages/vendor/VendorProducts";
import VendorPortfolio from "@/pages/vendor/VendorPortfolio";
import VendorReviews from "@/pages/vendor/VendorReviews";
import VendorMessages from "@/pages/vendor/VendorMessages";
import VendorAnalytics from "@/pages/vendor/VendorAnalytics";
import VendorPayments from "@/pages/vendor/VendorPayments";
import VendorSettings from "@/pages/vendor/VendorSettings";
import VendorBookings from "@/pages/vendor/VendorBookings";
import VendorNotifications from "@/pages/vendor/VendorNotifications";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login">
        <AuthLayout><Login /></AuthLayout>
      </Route>
      <Route path="/signup">
        <AuthLayout><Signup /></AuthLayout>
      </Route>
      <Route path="/verify-email">
        <AuthLayout><VerifyEmail /></AuthLayout>
      </Route>
      <Route path="/forgot-password">
        <AuthLayout><ForgotPassword /></AuthLayout>
      </Route>

      {/* Admin Dashboard */}
      <Route path="/admin">
        <AdminLayout><AdminOverview /></AdminLayout>
      </Route>
      <Route path="/admin/vendors">
        <AdminLayout><AdminVendors /></AdminLayout>
      </Route>
      <Route path="/admin/customers">
        <AdminLayout><AdminCustomers /></AdminLayout>
      </Route>
      <Route path="/admin/bookings">
        <AdminLayout><AdminBookings /></AdminLayout>
      </Route>
      <Route path="/admin/analytics">
        <AdminLayout><AdminAnalytics /></AdminLayout>
      </Route>
      <Route path="/admin/settings">
        <AdminLayout><AdminSettings /></AdminLayout>
      </Route>
      <Route path="/admin/announcements">
        <AdminLayout><AdminAnnouncements /></AdminLayout>
      </Route>
      <Route path="/admin/refunds">
        <AdminLayout><AdminRefunds /></AdminLayout>
      </Route>
      <Route path="/admin/audit-log">
        <AdminLayout><AdminAuditLog /></AdminLayout>
      </Route>

      {/* Customer Dashboard */}
      <Route path="/account">
        <CustomerLayout><Account /></CustomerLayout>
      </Route>
      <Route path="/saved">
        <CustomerLayout><Saved /></CustomerLayout>
      </Route>
      <Route path="/my-reviews">
        <CustomerLayout><MyReviews /></CustomerLayout>
      </Route>
      <Route path="/following">
        <CustomerLayout><Following /></CustomerLayout>
      </Route>
      <Route path="/bookings">
        <CustomerLayout><Bookings /></CustomerLayout>
      </Route>
      <Route path="/history">
        <CustomerLayout><History /></CustomerLayout>
      </Route>
      <Route path="/messages">
        <CustomerLayout><CustomerMessages /></CustomerLayout>
      </Route>
      <Route path="/messages/:id">
        {(params) => (
          <CustomerLayout><CustomerMessages conversationId={params.id} /></CustomerLayout>
        )}
      </Route>
      <Route path="/notifications">
        <CustomerLayout><Notifications /></CustomerLayout>
      </Route>
      <Route path="/account/settings">
        <CustomerLayout><CustomerSettings /></CustomerLayout>
      </Route>

      {/* Vendor Dashboard */}
      <Route path="/vendor/dashboard">
        <VendorLayout><VendorDashboard /></VendorLayout>
      </Route>
      <Route path="/vendor/profile">
        <VendorLayout><VendorProfile /></VendorLayout>
      </Route>
      <Route path="/vendor/services">
        <VendorLayout><VendorServices /></VendorLayout>
      </Route>
      <Route path="/vendor/products">
        <VendorLayout><VendorProducts /></VendorLayout>
      </Route>
      <Route path="/vendor/portfolio">
        <VendorLayout><VendorPortfolio /></VendorLayout>
      </Route>
      <Route path="/vendor/reviews">
        <VendorLayout><VendorReviews /></VendorLayout>
      </Route>
      <Route path="/vendor/bookings">
        <VendorLayout><VendorBookings /></VendorLayout>
      </Route>
      <Route path="/vendor/notifications">
        <VendorLayout><VendorNotifications /></VendorLayout>
      </Route>
      <Route path="/vendor/messages">
        <VendorLayout><VendorMessages /></VendorLayout>
      </Route>
      <Route path="/vendor/analytics">
        <VendorLayout><VendorAnalytics /></VendorLayout>
      </Route>
      <Route path="/vendor/payments">
        <VendorLayout><VendorPayments /></VendorLayout>
      </Route>
      <Route path="/vendor/settings">
        <VendorLayout><VendorSettings /></VendorLayout>
      </Route>

      {/* Public Routes */}
      <Route path="/">
        <PublicLayout><Home /></PublicLayout>
      </Route>
      <Route path="/browse">
        <PublicLayout><Browse /></PublicLayout>
      </Route>
      <Route path="/vendor/:slug">
        <PublicLayout><Vendor /></PublicLayout>
      </Route>
      <Route path="/category/:slug">
        <PublicLayout><Category /></PublicLayout>
      </Route>
      <Route path="/about">
        <PublicLayout><About /></PublicLayout>
      </Route>
      <Route path="/contact">
        <PublicLayout><Contact /></PublicLayout>
      </Route>
      <Route path="/faq">
        <PublicLayout><FAQ /></PublicLayout>
      </Route>
      <Route path="/terms">
        <PublicLayout><Terms /></PublicLayout>
      </Route>
      <Route path="/privacy">
        <PublicLayout><Privacy /></PublicLayout>
      </Route>

      <Route>
        <PublicLayout><NotFound /></PublicLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="casa-corona-theme">
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
