import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Mock, client-side-only authentication.
//
// There is no backend yet (see roadmap.md — Phase 2 backend auth API is still
// planned). Everything here is persisted to localStorage purely so the flow
// feels real across page refreshes. Passwords are stored in plain text in
// localStorage, which is fine for this UI-only preview but MUST be replaced
// once the real auth API (JWT, hashing, etc.) lands.
// ─────────────────────────────────────────────────────────────────────────────

export type AccountType = "personal" | "business";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  accountType: AccountType;
}

interface StoredUser extends AuthUser {
  password: string;
  verified: boolean;
}

interface PendingFlow {
  userId: string;
  stage: "verify-email" | "mfa";
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
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (
    name: string,
    email: string,
    password: string,
    accountType: AccountType
  ) => Promise<AuthResult>;
  verifyOTP: (code: string) => Promise<AuthResult>;
  verifyMFA: (code: string) => Promise<AuthResult>;
  logout: () => void;
}

const USERS_KEY = "mevrelbank.auth.users";
const SESSION_KEY = "mevrelbank.auth.session";
const PENDING_KEY = "mevrelbank.auth.pending";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadPending(): PendingFlow | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingFlow) : null;
  } catch {
    return null;
  }
}

function savePending(pending: PendingFlow | null) {
  if (pending) localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  else localStorage.removeItem(PENDING_KEY);
}

function loadSessionUserId(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { userId: string }).userId ?? null;
  } catch {
    return null;
  }
}

function saveSessionUserId(userId: string | null) {
  if (userId) localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
  else localStorage.removeItem(SESSION_KEY);
}

function toPublicUser(u: StoredUser): AuthUser {
  return { id: u.id, name: u.name, email: u.email, accountType: u.accountType };
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tempUser, setTempUser] = useState<AuthUser | null>(null);
  const [isMfaRequired, setIsMfaRequired] = useState(false);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    const users = loadUsers();

    const sessionUserId = loadSessionUserId();
    if (sessionUserId) {
      const found = users.find((u) => u.id === sessionUserId && u.verified);
      if (found) setUser(toPublicUser(found));
      else saveSessionUserId(null);
    }

    const pending = loadPending();
    if (pending) {
      const found = users.find((u) => u.id === pending.userId);
      if (found) {
        setTempUser(toPublicUser(found));
        setIsMfaRequired(pending.stage === "mfa");
      } else {
        savePending(null);
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = loadUsers();
    const found = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!found || found.password !== password) {
      return { success: false, error: "Invalid email or password." };
    }
    if (!found.verified) {
      return { success: false, error: "Please verify your email before signing in." };
    }

    const pending: PendingFlow = { userId: found.id, stage: "mfa" };
    savePending(pending);
    setTempUser(toPublicUser(found));
    setIsMfaRequired(true);
    return { success: true };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    accountType: AccountType
  ): Promise<AuthResult> => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = loadUsers();

    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: "An account with this email already exists." };
    }

    const created: StoredUser = {
      id: newId(),
      name: name.trim(),
      email: normalizedEmail,
      password,
      accountType,
      verified: false,
    };

    saveUsers([...users, created]);

    const pending: PendingFlow = { userId: created.id, stage: "verify-email" };
    savePending(pending);
    setTempUser(toPublicUser(created));
    setIsMfaRequired(false);
    return { success: true };
  };

  const verifyOTP = async (code: string): Promise<AuthResult> => {
    const pending = loadPending();
    if (!pending || pending.stage !== "verify-email") {
      return { success: false, error: "No pending email verification found." };
    }
    if (!/^\d{6}$/.test(code.trim())) {
      return { success: false, error: "Please enter the full 6-digit code." };
    }

    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === pending.userId);
    if (idx === -1) {
      return { success: false, error: "Account not found." };
    }

    users[idx] = { ...users[idx], verified: true };
    saveUsers(users);
    savePending(null);
    setTempUser(null);
    setIsMfaRequired(false);
    return { success: true };
  };

  const verifyMFA = async (code: string): Promise<AuthResult> => {
    const pending = loadPending();
    if (!pending || pending.stage !== "mfa") {
      return { success: false, error: "No pending sign-in found." };
    }
    if (!/^\d{6}$/.test(code.trim())) {
      return { success: false, error: "Please enter the full 6-digit code." };
    }

    const users = loadUsers();
    const found = users.find((u) => u.id === pending.userId);
    if (!found) {
      return { success: false, error: "Account not found." };
    }

    savePending(null);
    saveSessionUserId(found.id);
    setUser(toPublicUser(found));
    setTempUser(null);
    setIsMfaRequired(false);
    return { success: true };
  };

  const logout = () => {
    saveSessionUserId(null);
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isMfaRequired,
    tempUser,
    login,
    register,
    verifyOTP,
    verifyMFA,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
