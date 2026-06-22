import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, MapPin, Camera, CalendarDays, Clock, CheckCircle, CheckCircle2, XCircle, Star, Loader2, Mail, X, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { formatNaira } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { bookingApi, userApi, authApi, Booking, uploadApi } from "@/lib/api-client";

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: CheckCircle2 },
  completed: { label: "Completed", color: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: XCircle },
};

export default function Account() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Handle OAuth redirect with tokens in URL fragment
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    
    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem('cc_access_token', accessToken);
      // Note: We can't store httpOnly refresh token in localStorage for security
      // The backend should also set it as a cookie, but this ensures access token works
      
      // Clear URL fragment
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      
      // Refresh auth state
      refresh?.();
      
      toast({ title: "Welcome!", description: "You're now signed in with Google." });
    }
  }, [refresh, toast]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const { urls } = await uploadApi.images(fd);
      await userApi.updateProfile({ avatarUrl: urls[0] });
      await refresh?.();
      toast({ title: "Profile photo updated" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  // Email verification banner — visible for unverified users (OAuth or pending signup)
  const [verifyOtp, setVerifyOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await authApi.resendOtp({ email: user!.email });
      toast({ title: "Code sent", description: "Check your email for a new verification code." });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Could not send code", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!verifyOtp || verifyOtp.length < 6) return;
    setVerifying(true);
    try {
      await authApi.verifyOtp({ email: user!.email, otp: verifyOtp });
      toast({ title: "Email verified!", description: "Welcome to Casa Corona." });
      setVerifyOtp("");
      await refresh();
    } catch (e: any) {
      toast({ title: "Invalid code", description: e?.message ?? "Please try again", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  // Profile form state — seeded from auth user
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [state, setState] = useState(user?.state ?? "");
  const [saving, setSaving] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Seed form when user loads
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setCity(user.city ?? "");
      setState(user.state ?? "");
    }
  }, [user?.id]);

  // Recent bookings
  const { data: bookingsData } = useApi(() => bookingApi.list({ limit: 4 }));
  const recentBookings = bookingsData?.bookings ?? [];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await userApi.updateProfile({ name, phone, city, state });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setChangingPw(true);
    try {
      await userApi.changePassword({ currentPassword, newPassword });
      toast({ title: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Failed to change password", variant: "destructive" });
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-serif font-bold mb-1">My Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your personal information and view your bookings.</p>
      </div>

      {/* ── Email verification banner (only when unverified) ────────────── */}
      {user && !user.emailVerified && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">Verify your email</h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                We sent a 6-digit code to <strong>{user.email}</strong>. Enter it below to unlock bookings, messages, and all features.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Input
                  value={verifyOtp}
                  onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  className="bg-white dark:bg-background h-11 max-w-[200px] font-mono tracking-widest text-center"
                  inputMode="numeric"
                />
                <div className="flex gap-2">
                  <Button onClick={handleVerifyOtp} disabled={verifying || verifyOtp.length < 6} className="rounded-full">
                    {verifying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</> : "Verify"}
                  </Button>
                  <Button variant="outline" onClick={handleResendOtp} disabled={resending} className="rounded-full">
                    {resending ? "Sending…" : "Resend code"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile info ───────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center gap-5 mb-7">
          <div className="relative">
            <Avatar className="h-20 w-20">
              {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-2xl">
                {initials(user?.name ?? "U")}
              </AvatarFallback>
            </Avatar>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {uploadingAvatar ? (
                <Loader2 size={14} className="text-primary-foreground animate-spin" />
              ) : (
                <Camera size={14} className="text-primary-foreground" />
              )}
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-sm text-muted-foreground break-all">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium capitalize">
                {user?.role || "Customer"}
              </span>
              {user?.phone && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" /> {user.phone}
                </span>
              )}
              {user?.city && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {[user.city, user.state].filter(Boolean).join(", ")}
                </span>
              )}
              {user?.emailVerified && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full px-2 py-0.5 font-medium">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <Input value={user?.email ?? ""} type="email" disabled className="h-11 opacity-60" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number</Label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Victoria Island"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>State</Label>
            <Input
              value={state}
              onChange={e => setState(e.target.value)}
              placeholder="e.g. Lagos"
              className="h-11"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button className="rounded-full px-8" onClick={handleSaveProfile} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* ── Set password for OAuth users ────────────────────────────────────── */}
      {user && user.hasPassword === false && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">Set a password for direct login</h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                You signed up with Google. Set a password to enable email/password login as well.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="New password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11 bg-white dark:bg-background"
            />
            <Input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 bg-white dark:bg-background"
            />
            <Button
              onClick={async () => {
                if (newPassword !== confirmPassword) {
                  toast({ title: "Passwords don't match", variant: "destructive" });
                  return;
                }
                if (newPassword.length < 8) {
                  toast({ title: "Password must be at least 8 characters", variant: "destructive" });
                  return;
                }
                setChangingPw(true);
                try {
                  await authApi.setPassword(newPassword);
                  toast({ title: "Password set successfully" });
                  setNewPassword("");
                  setConfirmPassword("");
                  await refresh();
                } catch (e: any) {
                  toast({ title: "Error", description: e.message, variant: "destructive" });
                } finally {
                  setChangingPw(false);
                }
              }}
              disabled={changingPw || !newPassword || newPassword.length < 8}
              className="rounded-full"
            >
              {changingPw ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting…</> : "Set Password"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Recent bookings ────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-bold text-lg">Recent Bookings</h2>
          <Link href="/bookings" className="text-sm text-primary hover:underline font-medium">View all</Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="bg-muted/30 rounded-2xl p-8 text-center text-muted-foreground text-sm">
            No bookings yet.{" "}
            <Link href="/browse" className="text-primary hover:underline">Browse vendors</Link>
            {" "}to make your first booking.
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking: Booking) => {
              const statusKey = booking.status as keyof typeof statusConfig;
              const status = statusConfig[statusKey] ?? statusConfig.pending;
              const StatusIcon = status.icon;
              const scheduledDate = new Date(booking.scheduledFor);
              return (
                <div key={booking.id} className="bg-card border rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border">
                    <CalendarDays className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{booking.customerName}</p>
                        <p className="text-xs text-muted-foreground">{booking.notes || "No notes"}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="w-3 h-3" />
                        {scheduledDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {scheduledDate.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  {booking.status === "completed" && (
                    <Button size="sm" variant="outline" className="rounded-full text-xs shrink-0 gap-1 h-8 px-3">
                      <Star className="w-3 h-3" /> Review
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Change password ────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-5">Change Password</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              className="h-11"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              className="h-11"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              className="h-11"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="rounded-full px-8"
              onClick={handleChangePassword}
              disabled={changingPw || !currentPassword || !newPassword}
            >
              {changingPw ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating…</> : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
