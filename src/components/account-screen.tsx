"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import { Card, Field, Input, PillButton, SectionTitle, Shell } from "@/components/ui";

function StatusMessage({ message, tone }: { message: string; tone: "error" | "info" }) {
  return (
    <div
      className={`rounded-[20px] border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-red-400/20 bg-red-500/10 text-red-100"
          : "border-blue-400/20 bg-blue-500/10 text-blue-100"
      }`}
    >
      {message}
    </div>
  );
}

export function AccountScreen() {
  const auth = useAuth();
  const { actions: storeActions, guestDataAvailable, syncMode, syncStatus } = useAppStore();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  if (!auth.configured) {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-2xl space-y-5">
          <header className="mb-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/65">Account</p>
            <h1 className="mt-3 text-white">Connect Fervet to Supabase</h1>
            <p className="mt-3 max-w-xl text-sm text-muted/90">
              Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable account auth,
              email flows, profile syncing, and multi-device data sync.
            </p>
          </header>
          <Card className="space-y-3">
            <p className="text-sm text-muted/88">Guest mode is still active, including localStorage and backups.</p>
            <Link href="/progress">
              <PillButton variant="ghost">Back to Progress</PillButton>
            </Link>
          </Card>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="mb-3">
          <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/65">Account</p>
          <h1 className="mt-3 text-white">Auth, profile, and sync.</h1>
          <p className="mt-3 max-w-xl text-sm text-muted/90">
            Sign in to sync Fervet across devices, keep your profile together, and safely import local data into your account.
          </p>
        </header>

        {auth.statusMessage ? <StatusMessage message={auth.statusMessage} tone="info" /> : null}
        {auth.errorMessage ? <StatusMessage message={auth.errorMessage} tone="error" /> : null}

        {!auth.session ? (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="space-y-4">
              <SectionTitle
                title={mode === "signin" ? "Sign in" : "Create account"}
                subtitle="Google, Apple, or email."
              />
              <div className="flex gap-3">
                <PillButton onClick={() => auth.actions.signInWithProvider("google")}>Continue with Google</PillButton>
                <PillButton onClick={() => auth.actions.signInWithProvider("apple")} variant="ghost">
                  Continue with Apple
                </PillButton>
              </div>
              <div className="grid gap-3">
                {mode === "signup" ? (
                  <>
                    <Field label="Username">
                      <Input onChange={(event) => setUsername(event.target.value)} value={username} />
                    </Field>
                    <Field label="Display name">
                      <Input onChange={(event) => setDisplayName(event.target.value)} value={displayName} />
                    </Field>
                    <Field label="Country">
                      <Input onChange={(event) => setCountry(event.target.value)} value={country} />
                    </Field>
                    <Field label="Profile picture">
                      <Input
                        accept="image/*"
                        onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                        type="file"
                      />
                    </Field>
                  </>
                ) : null}
                <Field label="Email">
                  <Input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
                </Field>
                <Field label="Password">
                  <Input onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
                </Field>
                <PillButton
                  onClick={() => {
                    if (mode === "signin") {
                      void auth.actions.signInWithEmail(email, password);
                    } else {
                      void auth.actions.signUp({
                        username,
                        email,
                        password,
                        displayName,
                        country,
                        avatarFile,
                      });
                    }
                  }}
                >
                  {mode === "signin" ? "Sign in" : "Create account"}
                </PillButton>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <button className="text-blue-100/80" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} type="button">
                  {mode === "signin" ? "Need an account?" : "Already have an account?"}
                </button>
                <button className="text-blue-100/80" onClick={() => void auth.actions.requestPasswordReset(email)} type="button">
                  Forgot password
                </button>
                <button className="text-blue-100/80" onClick={() => void auth.actions.resendVerification(email)} type="button">
                  Resend verification
                </button>
              </div>
            </Card>

            <Card className="space-y-4">
              <SectionTitle title="How sync works" subtitle="Local-first by default, account-backed when you sign in." />
              <div className="space-y-3 text-sm text-muted/88">
                <p>Guest mode keeps using localStorage and the existing backup system.</p>
                <p>Signed-in mode stores your data under your account so the same habits, tasks, logs, and goals can load on another device.</p>
                <p>Existing local data is not overwritten automatically. After sign-in, you can explicitly import it into your account.</p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="space-y-4">
              <SectionTitle title="Profile" subtitle="Edit your account details and avatar." />
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.05]">
                  {auth.profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="Profile avatar" className="h-full w-full object-cover" src={auth.profile.avatar_url} />
                  ) : (
                    <span className="text-lg font-medium text-white">
                      {(auth.profile?.display_name ?? auth.profile?.username ?? auth.user?.email ?? "F").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-base font-medium text-white">{auth.profile?.display_name || auth.profile?.username || "Fervet account"}</p>
                  <p className="text-sm text-muted/85">{auth.user?.email}</p>
                </div>
              </div>
              <Field label="Username">
                <Input defaultValue={auth.profile?.username ?? ""} id="profile-username" />
              </Field>
              <Field label="Display name">
                <Input defaultValue={auth.profile?.display_name ?? ""} id="profile-display-name" />
              </Field>
              <Field label="Country">
                <Input defaultValue={auth.profile?.country ?? ""} id="profile-country" />
              </Field>
              <Field label="Profile picture">
                <Input accept="image/*" id="profile-avatar" type="file" />
              </Field>
              <div className="flex flex-wrap gap-3">
                <PillButton
                  onClick={() => {
                    const usernameInput = document.getElementById("profile-username") as HTMLInputElement | null;
                    const displayNameInput = document.getElementById("profile-display-name") as HTMLInputElement | null;
                    const countryInput = document.getElementById("profile-country") as HTMLInputElement | null;
                    const avatarInput = document.getElementById("profile-avatar") as HTMLInputElement | null;
                    void auth.actions.updateProfile({
                      username: usernameInput?.value ?? auth.profile?.username ?? "",
                      displayName: displayNameInput?.value ?? "",
                      country: countryInput?.value ?? "",
                      avatarFile: avatarInput?.files?.[0] ?? null,
                    });
                  }}
                >
                  Save profile
                </PillButton>
                <Link href="/account/reset">
                  <PillButton variant="ghost">Change password</PillButton>
                </Link>
                <PillButton onClick={() => void auth.actions.signOut()} variant="ghost">
                  Log out
                </PillButton>
              </div>
            </Card>

            <Card className="space-y-4">
              <SectionTitle title="Data sync" subtitle="Your account-backed Fervet data." />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/45">Mode</p>
                  <p className="mt-2 text-lg font-medium text-white">{syncMode === "account" ? "Account sync" : "Guest local"}</p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/45">Status</p>
                  <p className="mt-2 text-lg font-medium text-white">{syncStatus}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-muted/88">
                <p>Signed-in data syncs goals, habits, tasks, study logs, activity logs, running logs, and body metrics.</p>
                <p>Backups still work exactly as before.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <PillButton
                  disabled={!guestDataAvailable}
                  onClick={() => {
                    if (!window.confirm("Import your current local data into this account and replace the synced copy?")) return;
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
