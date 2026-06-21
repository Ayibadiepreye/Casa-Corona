import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MailOpen, CheckCircle2, RefreshCw } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function VerifyEmail() {
  const { verifyOtp, user } = useAuth();
  const [, setLocation] = useLocation();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  // Get email from localStorage or use a default (we'll improve later)
  const [email] = useState(() => {
    const savedEmail = localStorage.getItem("signupEmail");
    return savedEmail || "";
  });

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleVerify = async () => {
    if (otp.length < 6) { setError("Please enter the full 6-digit code"); return; }
    setLoading(true);
    setError("");
    try {
      // Use the email from localStorage or prompt if not available (temp solution)
      const userEmail = email || prompt("Please enter your email:") || "";
      const user = await verifyOtp({ email: userEmail, otp });
      setLoading(false);
      setVerified(true);
      // Redirect after showing success
      setTimeout(() => {
        setLocation(user.role === "vendor" ? "/vendor/dashboard" : "/account");
      }, 1800);
    } catch (err) {
      setLoading(false);
      setError("Verification failed. Please try again.");
      console.error("Verify OTP error", err);
    }
  };

  const handleResend = () => {
    setCanResend(false);
    setResendTimer(60);
    setOtp("");
    setError("");
  };

  if (verified) {
    return (
      <div className="bg-card border rounded-2xl p-6 sm:p-10 shadow-sm text-center">
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-serif font-bold mb-2">Email Verified!</h1>
        <p className="text-muted-foreground">
          {user?.role === "vendor" ? "Your business account is ready. Redirecting to your dashboard..." : "Your account is ready. Redirecting..."}
        </p>
        <div className="mt-6 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-2xl p-6 sm:p-10 shadow-sm text-center">
      <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
        <MailOpen className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-serif font-bold mb-2">Check your inbox</h1>
      <p className="text-muted-foreground mb-2">
        We sent a 6-digit code to
      </p>
      {user?.email && (
        <p className="font-semibold text-foreground mb-8">{user.email}</p>
      )}

      <div className="flex justify-center mb-3">
        <InputOTP maxLength={6} value={otp} onChange={(val) => { setOtp(val); setError(""); }}>
          <InputOTPGroup>
            {[0,1,2,3,4,5].map(i => (
              <InputOTPSlot key={i} index={i} className="w-10 h-12 sm:w-12 sm:h-14 text-lg" />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      <Button
        onClick={handleVerify}
        disabled={loading || otp.length < 6}
        className="w-full rounded-full h-12 text-base mb-6 mt-4"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            Verifying...
          </span>
        ) : "Verify Account"}
      </Button>

      <div className="text-sm text-muted-foreground">
        Didn't receive the code?{" "}
        {canResend ? (
          <button onClick={handleResend} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Resend
          </button>
        ) : (
          <span className="text-muted-foreground/70">Resend in {resendTimer}s</span>
        )}
      </div>

      <div className="mt-6 text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-foreground hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
