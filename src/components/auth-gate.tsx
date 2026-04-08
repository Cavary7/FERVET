"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AccountScreen } from "@/components/account-screen";
import { useAuth } from "@/lib/auth";

const PUBLIC_PATH_PREFIXES = ["/auth/callback", "/account/reset"];
const GATE_TIMEOUT_MS = 3000;

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const auth = useAuth();
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setForceReady(true);
    }, GATE_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, []);

  const gateReady = auth.ready || forceReady;

  if (!gateReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/65">Fervet</p>
          <p className="mt-3 text-sm text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (!auth.configured) {
    return <>{children}</>;
  }

  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return <>{children}</>;
  }

  if (!auth.session) {
    return <AccountScreen mode="auth" />;
  }

  return <>{children}</>;
}
