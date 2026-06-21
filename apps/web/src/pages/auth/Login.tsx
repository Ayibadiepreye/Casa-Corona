import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

function GoogleLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}

export default function Login() {
  const { signIn, user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const user = await signIn({ email: values.email, password: values.password });
      setLoading(false);
      if (user?.role === "admin") setLocation("/admin");
      else if (user?.role === "vendor") setLocation("/vendor/dashboard");
      else setLocation("/account");
    } catch (e: any) {
      setLoading(false);
      console.error("Login failed", e);
      form.setError("root", { message: e?.message || "Sign in failed" });
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      // Hit the backend's /auth/google endpoint to check it exists, then redirect.
      // If OAuth isn't configured, this returns 501 with a clear message.
      const res = await fetch(`${API_BASE}/auth/google`, { method: "GET", redirect: "manual", credentials: "include" });
      if (res.status === 0 || res.type === "opaqueredirect") {
        // Browser blocked the redirect — fall through to window.location
      }
      if (res.status === 501) {
        const body = await res.json().catch(() => ({}));
        setGoogleError(body?.error?.message || "Google sign-in is not configured yet");
        setGoogleLoading(false);
        return;
      }
      window.location.href = `${API_BASE}/auth/google`;
    } catch (e: any) {
      setGoogleError("Could not start Google sign-in. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="bg-card border rounded-2xl p-6 sm:p-10 shadow-sm">
      <h1 className="text-2xl font-serif font-bold mb-2 text-center">Welcome Back</h1>
      <p className="text-muted-foreground text-center mb-6">Sign in to your Casa Corona account.</p>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 rounded-full mb-6 relative hover:bg-muted/50"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
      >
        <GoogleLogo className="w-5 h-5 absolute left-4" />
        {googleLoading ? "Connecting to Google..." : "Continue with Google"}
      </Button>

      {googleError && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center">
          {googleError}
        </div>
      )}

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {form.formState.errors.root && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {form.formState.errors.root.message}
            </div>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="jane@example.com" className="bg-background h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" placeholder="••••••••" className="bg-background h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full rounded-full h-12 text-base mt-2" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
