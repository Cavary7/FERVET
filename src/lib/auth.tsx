"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadAuthSession, removeStorageKey, saveAuthSession, AUTH_SESSION_STORAGE_KEY } from "@/lib/storage";
import {
  AuthSession,
  FervetProfile,
  fetchProfile,
  getOAuthUrl,
  getUser,
  isSupabaseConfigured,
  isUsernameAvailable,
  refreshSession,
  requestPasswordReset,
  resendVerificationEmail,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updatePassword,
  uploadAvatar,
  upsertProfile,
  validateUsername,
} from "@/lib/supabase";

type SignUpInput = {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  country?: string;
  avatarFile?: File | null;
};

type AuthContextValue = {
  configured: boolean;
  ready: boolean;
  session: AuthSession | null;
  user: AuthSession["user"] | null;
  profile: FervetProfile | null;
  statusMessage: string | null;
  errorMessage: string | null;
  pendingVerificationEmail: string | null;
  actions: {
    clearMessages: () => void;
    signInWithEmail: (email: string, password: string) => Promise<boolean>;
    signInWithProvider: (provider: "google" | "apple") => void;
    signUp: (input: SignUpInput) => Promise<boolean>;
    resendVerification: (email?: string) => Promise<boolean>;
    requestPasswordReset: (email: string) => Promise<boolean>;
    updatePassword: (password: string) => Promise<boolean>;
    updateProfile: (input: {
      username: string;
      displayName?: string;
      country?: string;
      avatarFile?: File | null;
    }) => Promise<boolean>;
    signOut: () => Promise<void>;
  };
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredSession() {
  return loadAuthSession<AuthSession | null>(null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [ready, setReady] = useState(!configured);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<FervetProfile | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      try {
        const stored = loadStoredSession();
        if (!stored) {
          if (!cancelled) setReady(true);
          return;
        }

        let active: AuthSession | null = stored;
        if (stored.expiresAt && stored.expiresAt * 1000 < Date.now() && stored.refreshToken) {
          active = await refreshSession(stored.refreshToken);
          if (active) saveAuthSession(active);
        }

        if (!active) {
          removeStorageKey(AUTH_SESSION_STORAGE_KEY);
          if (!cancelled) setReady(true);
          return;
        }

        const user = await getUser(active.accessToken);
        const nextSession: AuthSession = {
          ...active,
          user,
        };
        const nextProfile = await fetchProfile(nextSession.accessToken, user.id);

        if (!cancelled) {
          setSession(nextSession);
          setProfile(nextProfile);
          saveAuthSession(nextSession);
          setReady(true);
        }
      } catch {
        removeStorageKey(AUTH_SESSION_STORAGE_KEY);
        if (!cancelled) {
          setSession(null);
          setProfile(null);
          setReady(true);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  const actions = useMemo<AuthContextValue["actions"]>(
    () => ({
      clearMessages() {
        setStatusMessage(null);
        setErrorMessage(null);
      },
      async signInWithEmail(email: string, password: string) {
        if (!configured) {
          setErrorMessage("Add Supabase env vars to enable sign-in.");
          return false;
        }
        try {
          setErrorMessage(null);
          const nextSession = await signInWithPassword(email, password);
          if (!nextSession) throw new Error("No session returned.");
          const nextProfile = await fetchProfile(nextSession.accessToken, nextSession.user.id);
          setSession(nextSession);
          setProfile(nextProfile);
          saveAuthSession(nextSession);
          setStatusMessage("Signed in successfully.");
          setPendingVerificationEmail(null);
          return true;
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Sign-in failed.");
          return false;
        }
      },
      signInWithProvider(provider: "google" | "apple") {
        if (!configured) {
          setErrorMessage("Add Supabase env vars to enable OAuth sign-in.");
          return;
        }
        window.location.href = getOAuthUrl(provider);
      },
      async signUp(input: SignUpInput) {
        if (!configured) {
          setErrorMessage("Add Supabase env vars to enable sign-up.");
          return false;
        }
        const usernameError = validateUsername(input.username);
        if (usernameError) {
          setErrorMessage(usernameError);
          return false;
        }

        try {
          setErrorMessage(null);
          const available = await isUsernameAvailable(input.username);
          if (!available) {
            setErrorMessage("That username is already taken.");
            return false;
          }

          const result = await signUpWithPassword(input);
          setPendingVerificationEmail(input.email);

          if (result.session) {
            let avatarUrl: string | null | undefined = undefined;
            if (input.avatarFile) {
              avatarUrl = await uploadAvatar(result.session.accessToken, result.session.user.id, input.avatarFile);
            }
            const nextProfile = await upsertProfile(result.session.accessToken, {
              user_id: result.session.user.id,
              email: input.email,
              username: input.username.trim(),
              username_normalized: input.username.trim().toLowerCase(),
              display_name: input.displayName?.trim() || null,
              country: input.country?.trim() || null,
              avatar_url: avatarUrl ?? null,
            });
            setSession(result.session);
            setProfile(nextProfile);
            saveAuthSession(result.session);
            setStatusMessage(result.pendingVerification ? "Check your email to confirm your account." : "Account created.");
          } else {
            setStatusMessage("Check your email to confirm your account.");
          }

          return true;
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Sign-up failed.");
          return false;
        }
      },
      async resendVerification(email?: string) {
        const target = email ?? pendingVerificationEmail ?? session?.user.email;
        if (!configured) {
          setErrorMessage("Add Supabase env vars to enable email verification.");
          return false;
        }
        if (!target) {
          setErrorMessage("Enter the account email first.");
          return false;
        }
        try {
          await resendVerificationEmail(target);
          setStatusMessage("Verification email sent.");
          setErrorMessage(null);
          return true;
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Could not resend verification email.");
          return false;
        }
      },
      async requestPasswordReset(email: string) {
        if (!configured) {
          setErrorMessage("Add Supabase env vars to enable password reset.");
          return false;
        }
        try {
          await requestPasswordReset(email);
          setStatusMessage("Password reset email sent.");
          setErrorMessage(null);
          return true;
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Password reset failed.");
          return false;
        }
      },
      async updatePassword(password: string) {
        if (!configured || !session) {
          setErrorMessage("You need an active account session first.");
          return false;
        }
        try {
          await updatePassword(session.accessToken, password);
          setStatusMessage("Password updated.");
          setErrorMessage(null);
          return true;
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Could not update password.");
          return false;
        }
      },
      async updateProfile(input) {
        if (!configured || !session) {
          setErrorMessage("Sign in to edit your profile.");
          return false;
        }
        const usernameError = validateUsername(input.username);
        if (usernameError) {
          setErrorMessage(usernameError);
          return false;
        }
        try {
          const normalized = input.username.trim().toLowerCase();
          if (profile?.username_normalized !== normalized) {
            const available = await isUsernameAvailable(input.username, session.accessToken);
            if (!available) {
              setErrorMessage("That username is already taken.");
              return false;
            }
          }

          const avatarUrl = input.avatarFile
            ? await uploadAvatar(session.accessToken, session.user.id, input.avatarFile)
            : profile?.avatar_url ?? null;

          const nextProfile = await upsertProfile(session.accessToken, {
            user_id: session.user.id,
            email: session.user.email ?? profile?.email ?? "",
            username: input.username.trim(),
            username_normalized: normalized,
            display_name: input.displayName?.trim() || null,
            country: input.country?.trim() || null,
            avatar_url: avatarUrl,
          });
          setProfile(nextProfile);
          setStatusMessage("Profile updated.");
          setErrorMessage(null);
          return true;
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Profile update failed.");
          return false;
        }
      },
      async signOut() {
        if (configured && session) {
          try {
            await signOut(session.accessToken);
          } catch {}
        }
        removeStorageKey(AUTH_SESSION_STORAGE_KEY);
        setSession(null);
        setProfile(null);
        setPendingVerificationEmail(null);
        setStatusMessage("Signed out.");
      },
    }),
    [configured, pendingVerificationEmail, profile, session],
  );

  return (
    <AuthContext.Provider
      value={{
        configured,
        ready,
        session,
        user: session?.user ?? null,
        profile,
        statusMessage,
        errorMessage,
        pendingVerificationEmail,
        actions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
