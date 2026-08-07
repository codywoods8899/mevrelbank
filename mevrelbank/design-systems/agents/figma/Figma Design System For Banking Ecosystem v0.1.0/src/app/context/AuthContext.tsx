import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Real backend auth — Phase 2, cookie sessions (Phase 5).
// Access token kept in memory only. The refresh token lives in an httpOnly,
// server-set session cookie — never touched by client JS — so a page reload
// silently restores the session via POST /auth/refresh instead of forcing a
// re-login. "Stay signed in" controls how long that cookie/session lasts
// (30 days) vs. the default (cleared when the browser fully closes, capped
// at 1 day server-side either way).
// ─────────────────────────────────────────────────────────────────────────────

export type AccountType = "personal" | "business";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  accountType: AccountType;
  totpEnabled: boolean;
  phone?: string | null;
  address?: string | null;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isMfaRequired: boolean;
  tempUser: AuthUser | null;
  accessToken: string | null;
  isRestoringSession: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthResult>;
  register: (name: string, email: string, password: string, accountType: AccountType) => Promise<AuthResult>;
  verifyOTP: (code: string) => Promise<AuthResult>;
  resendOTP: () => Promise<AuthResult>;
  verifyMFA: (code: string) => Promise<AuthResult>;
  sendMfaEmailCode: () => Promise<AuthResult>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<AuthResult>;
  setupTotp: () => Promise<{ secret: string; qrCode: string; otpauthUrl: string } | null>;
  enableTotp: (secret: string, code: string) => Promise<AuthResult>;
  disableTotp: (code: string) => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
  updateProfile: (fields: { name: string; phone?: string; address?: string }) => Promise<AuthResult>;
  authedFetch: (path: string, options?: RequestInit) => Promise<Response>;
}

const EMAIL_KEY = "mb.pendingEmail";
// In dev, always go through the Vite proxy (relative /api → localhost:3001) so the
// preview talks to this workspace's own backend rather than the production Railway
// deployment. VITE_API_BASE_URL is only used in production builds (Cloudflare Pages),
// where the frontend and backend are not same-origin.
const BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  return res;
}

async function apiJson(path: string, options: RequestInit = {}) {
  const res = await apiFetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any).error ?? `HTTP ${res.status}`);
  return body;
}

function loadPendingEmail() {
  return sessionStorage.getItem(EMAIL_KEY);
}

function savePendingEmail(email: string | null) {
  if (email) sessionStorage.setItem(EMAIL_KEY, email);
  else sessionStorage.removeItem(EMAIL_KEY);
}

function parseAccessToken(token: string): { exp: number; sub: string } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseAccessToken(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000 - 30_000;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tempUser, setTempUser]       = useState<AuthUser | null>(null);
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null);
  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const accessTokenRef = useRef<string | null>(null);
  accessTokenRef.current = accessToken;

  async function silentRefresh(): Promise<string | null> {
    try {
      const data = await apiJson("/auth/refresh", { method: "POST" });
      setAccessToken(data.accessToken);
      if (data.user) setUser(data.user as AuthUser);
      return data.accessToken;
    } catch {
      setUser(null);
      setAccessToken(null);
      return null;
    }
  }

  async function getValidAccessToken(): Promise<string | null> {
    const current = accessTokenRef.current;
    if (current && !isTokenExpired(current)) return current;
    return silentRefresh();
  }

  async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = await getValidAccessToken();
    return apiFetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  }

  async function authedJson(path: string, options: RequestInit = {}) {
    const res = await authedFetch(path, options);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((body as any).error ?? `HTTP ${res.status}`);
    return body;
  }

  // On first load, try to restore the session from the httpOnly cookie —
  // this is what makes refreshing the dashboard NOT require signing in again.
  useEffect(() => {
    silentRefresh().finally(() => setIsRestoringSession(false));
  }, []);

  const register = async (
    name: string, email: string, password: string, accountType: AccountType
  ): Promise<AuthResult> => {
    try {
      await apiJson("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, accountType }),
      });
      savePendingEmail(email.trim().toLowerCase());
      setPendingEmail(email.trim().toLowerCase());
      setTempUser({ id: "", name, email: email.trim().toLowerCase(), accountType, totpEnabled: false });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const verifyOTP = async (code: string): Promise<AuthResult> => {
    const email = pendingEmail ?? loadPendingEmail();
    if (!email) return { success: false, error: "Session expired. Please register again." };
    try {
      await apiJson("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      savePendingEmail(null);
      setPendingEmail(null);
      setTempUser(null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const resendOTP = async (): Promise<AuthResult> => {
    const email = pendingEmail ?? loadPendingEmail();
    if (!email) return { success: false, error: "No pending verification. Please register again." };
    try {
      await apiJson("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email, type: "email_verification" }),
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const login = async (email: string, password: string, remember = false): Promise<AuthResult> => {
    try {
      const data = await apiJson("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, remember }),
      });
      if (data.mfaRequired) {
        setMfaTempToken(data.tempToken);
        setTempUser({ id: "", name: "", email: email.trim().toLowerCase(), accountType: "personal", totpEnabled: true });
        setIsMfaRequired(true);
      } else {
        setAccessToken(data.accessToken);
        setUser(data.user as AuthUser);
        setIsMfaRequired(false);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const verifyMFA = async (code: string): Promise<AuthResult> => {
    if (!mfaTempToken) return { success: false, error: "Session expired. Please sign in again." };
    try {
      const data = await apiJson("/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ tempToken: mfaTempToken, code }),
      });
      setMfaTempToken(null);
      setTempUser(null);
      setIsMfaRequired(false);
      setAccessToken(data.accessToken);
      setUser(data.user as AuthUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const sendMfaEmailCode = async (): Promise<AuthResult> => {
    if (!mfaTempToken) return { success: false, error: "Session expired. Please sign in again." };
    try {
      await apiJson("/mfa/send-email-code", {
        method: "POST",
        body: JSON.stringify({ tempToken: mfaTempToken }),
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch { /* best effort */ }
    savePendingEmail(null);
    setUser(null);
    setAccessToken(null);
    setTempUser(null);
    setIsMfaRequired(false);
    setMfaTempToken(null);
  };

  const forgotPassword = async (email: string): Promise<AuthResult> => {
    try {
      await apiJson("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<AuthResult> => {
    try {
      await apiJson("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code, newPassword }),
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const setupTotp = async () => {
    try {
      const data = await authedJson("/mfa/setup");
      return data as { secret: string; qrCode: string; otpauthUrl: string };
    } catch {
      return null;
    }
  };

  const enableTotp = async (secret: string, code: string): Promise<AuthResult> => {
    try {
      await authedJson("/mfa/enable", {
        method: "POST",
        body: JSON.stringify({ secret, code }),
      });
      if (user) setUser({ ...user, totpEnabled: true });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const disableTotp = async (code: string): Promise<AuthResult> => {
    try {
      await authedJson("/mfa/disable", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (user) setUser({ ...user, totpEnabled: false });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const refreshUser = async () => {
    try {
      const data = await authedJson("/user/me");
      if (data.user) setUser(data.user as AuthUser);
    } catch { /* silent */ }
  };

  const updateProfile = async (fields: { name: string; phone?: string; address?: string }): Promise<AuthResult> => {
    try {
      const data = await authedJson("/user/me", {
        method: "PATCH",
        body: JSON.stringify(fields),
      });
      if (data.user) setUser(data.user as AuthUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isMfaRequired,
    tempUser,
    accessToken,
    isRestoringSession,
    login,
    register,
    verifyOTP,
    resendOTP,
    verifyMFA,
    sendMfaEmailCode,
    logout,
    forgotPassword,
    resetPassword,
    setupTotp,
    enableTotp,
    disableTotp,
    refreshUser,
    updateProfile,
    authedFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
