"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import { Card, PillButton, SectionTitle, Shell } from "@/components/ui";

export function AccountScreen({ mode = "profile" }: { mode?: "auth" | "profile" }) {
  const auth = useAuth();
  const { guestDataAvailable, syncMode, syncStatus, actions: storeActions } = useAppStore();

  if (!auth.ready) {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <header className="mb-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/65">
              {mode === "auth" ? "Welcome" : "Profile"}
            </p>
            <h1 className="mt-3 text-white">
              {mode === "auth" ? "Sign in to sync Fervet." : "Auth, profile, and sync."}
            </h1>
          </header>

          <Card className="space-y-4">
            <p className="text-sm text-muted/88">Loading account...</p>
          </Card>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="mb-3">
          <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/65">
            {mode === "auth" ? "Welcome" : "Profile"}
          </p>
          <h1 className="mt-3 text-white">
            {mode === "auth" ? "Sign in to sync Fervet." : "Auth, profile, and sync."}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted/90">
            {mode === "auth"
              ? "Sign in with your account to keep Fervet synced across devices."
              : "View your account status and manage synced data."}
          </p>
        </header>

        {!auth.session ? (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="space-y-4">
              <SectionTitle
                title="Account"
                subtitle="Authentication UI is temporarily simplified while production build issues are being resolved."
              />
              <div className="space-y-3 text-sm text-muted/88">
                <p>You are not signed in right now.</p>
                <p>
                  Local guest mode is still available, and your local data should continue working as before.
                </p>
              </div>
            </Card>

            <Card className="space-y-4">
              <SectionTitle
                title="How sync works"
                subtitle="Local-first by default, account-backed when signed in."
              />
              <div className="space-y-3 text-sm text-muted/88">
                <p>Guest mode keeps using localStorage and the existing backup system.</p>
                <p>When signed in, your data can sync across devices through your account.</p>
                <p>Existing local data is not overwritten automatically.</p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="space-y-4">
              <SectionTitle title="Profile" subtitle="Current signed-in account." />
              <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/45">Email</p>
                <p className="mt-2 text-base font-medium text-white">
                  {auth.user?.email ?? "Signed in"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/account/reset">
                  <PillButton variant="ghost">Change password</PillButton>
                </Link>
                <PillButton onClick={() => void auth.signOut()} variant="ghost">
                  Log out
                </PillButton>
              </div>
            </Card>

            <Card className="space-y-4">
              <SectionTitle title="Data sync" subtitle="Your account-backed Fervet data." />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/45">Mode</p>
                  <p className="mt-2 text-lg font-medium text-white">
                    {syncMode === "account" ? "Account sync" : "Guest local"}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/45">Status</p>
                  <p className="mt-2 text-lg font-medium text-white">{syncStatus}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-muted/88">
                <p>Signed-in data syncs your app data through your account.</p>
                <p>Backups still work exactly as before.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <PillButton
                  disabled={!guestDataAvailable}
                  onClick={() => {
                    if (!window.confirm("Import your current local data into this account and replace the synced copy?")) {
                      return;
                    }
                    void storeActions.importLocalDataToAccount();
                  }}
                >
                  Import local data into account
                </PillButton>
                <Link href="/progress">
                  <PillButton variant="ghost">Open backup tools</PillButton>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Shell>
  );
}
