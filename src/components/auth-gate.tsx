"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

type AuthGateProps = {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
};

export function AuthGate({
  children,
  fallback = null,
  requireAuth = false,
}: AuthGateProps) {
  const auth = useAuth();

  if (!auth.ready) {
    return <>{fallback}</>;
  }

  if (requireAuth && !auth.session) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}