import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
