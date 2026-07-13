import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAdminAuth } from "../context/AdminAuthContext";

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoringSession } = useAdminAuth();
  if (isRestoringSession) return null;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export function AdminPublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoringSession } = useAdminAuth();
  if (isRestoringSession) return null;
  if (isAuthenticated) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
