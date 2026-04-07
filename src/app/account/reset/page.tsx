"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { saveAuthSession } from "@/lib/storage";
import { readSessionFromUrlHash } from "@/lib/supabase";
import { Card, Field, Input, PillButton, Shell } from "@/components/ui";

export default function ResetPasswordPage() {
  const { actions, errorMessage, statusMessage } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const session = readSessionFromUrlHash(window.location.hash);
    if (!session) return;
    saveAuthSession(session);
    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.reload();
  }, []);

  return (
    <Shell>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center">
        <Card className="w-full space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/65">Fervet</p>
            <h1 className="mt-3 text-white">Choose a new password</h1>
            <p className="mt-2 text-sm text-muted/88">
              Use the recovery link from your email, then set a new password here.
            </p>
          </div>
          <Field label="New password">
            <Input onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
          </Field>
          <Field label="Confirm password">
            <Input onChange={(event) => setConfirm(event.target.value)} type="password" value={confirm} />
          </Field>
          <PillButton
            onClick={() => {
              if (!password || password !== confirm) return;
              void actions.updatePassword(password);
            }}
          >
            Update password
          </PillButton>
          {statusMessage ? <p className="text-sm text-blue-100">{statusMessage}</p> : null}
          {errorMessage ? <p className="text-sm text-red-100">{errorMessage}</p> : null}
          <Link className="text-sm text-blue-100/80" href="/account">
            Back to account
          </Link>
        </Card>
      </div>
    </Shell>
  );
}
