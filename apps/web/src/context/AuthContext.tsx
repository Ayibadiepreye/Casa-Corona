import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { authApi, User, SignupData, VerifyOtpData, LoginData } from "../lib/api-client";

const TOKEN_STORAGE_KEY = "cc_access_token";

export type UserRole = "customer" | "vendor" | "admin";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signUp: (data: SignupData) => Promise<{ userId: string; requiresVerification: boolean }>;
  verifyOtp: (data: VerifyOtpData) => Promise<User>;
  signIn: (data: LoginData) => Promise<User>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => {
    try { return localStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    try {
      if (t) localStorage.setItem(TOKEN_STORAGE_KEY, t);
      else localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const userData = await authApi.me();
      setUser(userData);
      // If /me succeeds, the cookie is valid; if we have a stored token, keep it.
      // If we have NO token but cookie is valid, /me still works for HTTP, but
      // socket auth needs a token — try a silent refresh to mint one.
      if (!token) {
        try {
          const refreshed = await authApi.refresh();
          setToken(refreshed.accessToken);
        } catch { /* no refresh cookie, user just not logged in */ }
      }
    } catch (error) {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  const signUp = useCallback(async (data: SignupData) => {
    return authApi.signup(data);
  }, []);

  const verifyOtp = useCallback(async (data: VerifyOtpData) => {
    const response = await authApi.verifyOtp(data);
    setUser(response.user);
    setToken(response.accessToken);
    return response.user;
  }, [setToken]);

  const signIn = useCallback(async (data: LoginData) => {
    const response = await authApi.login(data);
    if ('requiresVerification' in response && response.requiresVerification) {
      // Return a partial user; caller decides where to go
      return response.user as unknown as User;
    }
    setUser(response.user);
    setToken(response.accessToken);
    return response.user;
  }, [setToken]);

  const signOut = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    setUser(null);
    setToken(null);
    // Tell any in-flight components we're out
    window.dispatchEvent(new CustomEvent("cc:auth:signed_out"));
  }, [setToken]);

  const refresh = useCallback(async () => {
    try {
      const userData = await authApi.me();
      setUser(userData);
    } catch {
      setUser(null);
    }
  }, []);

  const refreshTokenOnly = useCallback(async () => {
    const response = await authApi.refresh();
    setToken(response.accessToken);
  }, [setToken]);

  const isAuthenticated = useMemo(() => !!user, [user]);
  const isAdmin = useMemo(() => user?.role === "admin", [user]);
  const isVendor = useMemo(() => user?.role === "vendor", [user]);
  const isCustomer = useMemo(() => user?.role === "customer", [user]);

  const value: AuthContextType = useMemo(() => ({
    user,
    token,
    loading,
    signUp,
    verifyOtp,
    signIn,
    signOut,
    refresh,
    isAuthenticated,
    isAdmin,
    isVendor,
    isCustomer,
  }), [user, token, loading, signUp, verifyOtp, signIn, signOut, refresh, isAuthenticated, isAdmin, isVendor, isCustomer]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}