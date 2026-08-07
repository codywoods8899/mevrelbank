import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Admin session — completely separate from the customer AuthContext. Only the
// support mailbox account (role = 'admin' in the backend) can ever sign in
// here; the backend rejects every other email at /api/admin/login. Uses its
// own httpOnly cookie (mb_admin_rt) so a browser can hold a customer session
// and an admin session at the same time without conflict.
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin";
  totpEnabled: boolean;
}

interface AdminAuthResult {
  success: boolean;
  error?: string;
}

interface AdminAuthContextValue {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isMfaRequired: boolean;
  isRestoringSession: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AdminAuthResult>;
  verifyMFA: (code: string) => Promise<AdminAuthResult>;
  sendMfaEmailCode: () => Promise<AdminAuthResult>;
  logout: () => Promise<void>;
  authedFetch: (path: string, options?: RequestInit) => Promise<Response>;
  authedJson: (path: string, options?: RequestInit) => Promise<any>;
}

// See AuthContext.tsx for rationale: dev always uses the Vite proxy (relative /api).
const BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

async function apiFetch(path: string, options: RequestInit = {}) {
  return fetch(`${BASE_URL}/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

async function apiJson(path: string, options: RequestInit = {}) {
  const res = await apiFetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any).error ?? `HTTP ${res.status}`);
  return body;
}

function parseAccessToken(token: string): { exp: number } | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseAccessToken(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000 - 30_000;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null);
  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const accessTokenRef = useRef<string | null>(null);
  accessTokenRef.current = accessToken;

  async function silentRefresh(): Promise<string | null> {
    try {
      const data = await apiJson("/admin/refresh", { method: "POST" });
      setAccessToken(data.accessToken);
      if (data.user) setAdmin(data.user as AdminUser);
      return data.accessToken;
    } catch {
      setAdmin(null);
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

  useEffect(() => {
    silentRefresh().finally(() => setIsRestoringSession(false));
  }, []);

  const login = async (email: string, password: string, remember = false): Promise<AdminAuthResult> => {
    try {
      const data = await apiJson("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password, remember }),
      });
      if (data.mfaRequired) {
        setMfaTempToken(data.tempToken);
        setIsMfaRequired(true);
      } else {
        setAccessToken(data.accessToken);
        setAdmin(data.user as AdminUser);
        setIsMfaRequired(false);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const verifyMFA = async (code: string): Promise<AdminAuthResult> => {
    if (!mfaTempToken) return { success: false, error: "Session expired. Please sign in again." };
    try {
      const data = await apiJson("/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ tempToken: mfaTempToken, code }),
      });
      setMfaTempToken(null);
      setIsMfaRequired(false);
      setAccessToken(data.accessToken);
      setAdmin(data.user as AdminUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const sendMfaEmailCode = async (): Promise<AdminAuthResult> => {
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
      await apiFetch("/admin/logout", { method: "POST" });
    } catch { /* best effort */ }
    setAdmin(null);
    setAccessToken(null);
    setMfaTempToken(null);
    setIsMfaRequired(false);
  };

  const value: AdminAuthContextValue = {
    admin,
    isAuthenticated: !!admin,
    isMfaRequired,
    isRestoringSession,
    login,
    verifyMFA,
    sendMfaEmailCode,
    logout,
    authedFetch,
    authedJson,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}
