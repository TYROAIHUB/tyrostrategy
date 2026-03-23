import type { ReactNode } from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { Navigate } from "react-router-dom";
import { useUIStore } from "@/stores/uiStore";

interface AuthGuardProps {
  children: ReactNode;
}

const isMockAuth = import.meta.env.VITE_MOCK_AUTH === "true";

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const mockLoggedIn = useUIStore((s) => s.mockLoggedIn);

  // Mock mode: kullanıcı login sayfasından giriş yapmalı
  if (isMockAuth) {
    if (mockLoggedIn) return <>{children}</>;
    return <Navigate to="/login" replace />;
  }

  // Gerçek MSAL mode
  if (isAuthenticated) return <>{children}</>;
  return <Navigate to="/login" replace />;
}
