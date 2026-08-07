import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

/** Wrap a route element that requires an authenticated session (e.g. /dashboard). */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoringSession } = useAuth();

  // Wait for the silent cookie-based refresh on mount before deciding —
  // otherwise a page reload would bounce straight to /login before the
  // session has a chance to restore.
  if (isRestoringSession) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/** Wrap a route element that signed-in users shouldn't see again (e.g. /login, /register). */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoringSession } = useAuth();

  if (isRestoringSession) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
