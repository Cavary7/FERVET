"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { saveAuthSession } from "@/lib/storage";
import { readSessionFromUrlHash } from "@/lib/supabase";
import { Card, PillButton, Shell } from "@/components/ui";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const session = readSessionFromUrlHash(window.location.hash);
    if (!session) {
      setMessage("This callback is missing a valid session.");
      return;
    }
    saveAuthSession(session);
    window.history.replaceState({}, document.title, window.location.pathname);
    setMessage("Success. Opening your account...");
    window.setTimeout(() => {
      window.location.replace("/account");
    }, 500);
  }, []);

  return (
    <Shell>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center">
        <Card className="w-full">
          <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/65">Fervet</p>
          <h1 className="mt-3 text-white">Account callback</h1>
          <p className="mt-3 text-sm text-muted/90">{message}</p>
          <div className="mt-5">
            <Link href="/account">
              <PillButton>Open account</PillButton>
            </Link>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
