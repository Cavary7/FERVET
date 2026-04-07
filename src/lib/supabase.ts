import { AppState } from "@/lib/types";

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: {
    id: string;
    email?: string;
    emailConfirmedAt?: string | null;
  };
};

export type FervetProfile = {
  user_id: string;
  username: string;
  username_normalized: string;
  email: string;
  display_name?: string | null;
  country?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const REDIRECT_PATH = "/auth/callback";
const RESET_PATH = "/account/reset";

export const USERNAME_BANNED_WORDS = [
  "admin",
  "support",
  "owner",
  "moderator",
  "staff",
  "fervet",
  "fuck",
  "shit",
  "bitch",
  "nigger",
  "cunt",
];

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function publicHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
  };
}

function authHeaders(accessToken: string, extra?: HeadersInit): HeadersInit {
  return {
    ...publicHeaders(),
    Authorization: `Bearer ${accessToken}`,
    ...(extra ?? {}),
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    let message = "Request failed.";
    try {
      const parsed = JSON.parse(text) as { error_description?: string; msg?: string; message?: string };
      message = parsed.error_description ?? parsed.msg ?? parsed.message ?? message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export function buildAbsoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string) {
  const normalized = normalizeUsername(value);
  if (normalized.length < 3 || normalized.length > 20) {
    return "Username must be 3-20 characters.";
  }
  if (!/^[a-z0-9_]+$/i.test(value.trim())) {
    return "Use only letters, numbers, and underscores.";
  }
  if (USERNAME_BANNED_WORDS.some((word) => normalized.includes(word))) {
    return "That username is not allowed.";
  }
  return null;
}

function mapSession(payload: {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  user?: { id: string; email?: string; email_confirmed_at?: string | null };
}): AuthSession | null {
  if (!payload.access_token || !payload.user?.id) return null;
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: payload.expires_at,
    user: {
      id: payload.user.id,
      email: payload.user.email,
      emailConfirmedAt: payload.user.email_confirmed_at,
    },
  };
}

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      sub?: string;
      email?: string;
      email_confirmed_at?: string | null;
    };
    return decoded;
  } catch {
    return null;
  }
}

export function readSessionFromUrlHash(hash: string): AuthSession | null {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(trimmed);
  const accessToken = params.get("access_token") ?? undefined;
  const decoded = accessToken ? decodeJwtPayload(accessToken) : null;
  return mapSession({
    access_token: accessToken,
    refresh_token: params.get("refresh_token") ?? undefined,
    expires_at: params.get("expires_at") ? Number(params.get("expires_at")) : undefined,
    user: accessToken
      ? {
          id: params.get("user_id") ?? decoded?.sub ?? "",
          email: params.get("email") ?? decoded?.email ?? undefined,
          email_confirmed_at: params.get("email_confirmed_at") ?? decoded?.email_confirmed_at ?? null,
        }
      : undefined,
  });
}

export async function getUser(accessToken: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: authHeaders(accessToken),
  });
  const data = await parseJson<{ id: string; email?: string; email_confirmed_at?: string | null }>(response);
  return {
    id: data.id,
    email: data.email,
    emailConfirmedAt: data.email_confirmed_at,
  };
}

export async function refreshSession(refreshToken: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await parseJson<{
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
    user: { id: string; email?: string; email_confirmed_at?: string | null };
  }>(response);
  return mapSession(data);
}

export async function signInWithPassword(email: string, password: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson<{
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
    user: { id: string; email?: string; email_confirmed_at?: string | null };
  }>(response);
  return mapSession(data);
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  username: string;
  displayName?: string;
  country?: string;
}) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      data: {
        username: input.username,
        display_name: input.displayName ?? null,
        country: input.country ?? null,
      },
      options: {
        emailRedirectTo: buildAbsoluteUrl(REDIRECT_PATH),
      },
    }),
  });

  const data = await parseJson<{
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    user?: { id: string; email?: string; email_confirmed_at?: string | null };
  }>(response);

  return {
    session: mapSession(data),
    pendingVerification: !data.access_token,
  };
}

export async function requestPasswordReset(email: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify({
      email,
      redirect_to: buildAbsoluteUrl(RESET_PATH),
    }),
  });
  await parseJson<Record<string, never>>(response);
}

export async function resendVerificationEmail(email: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/resend`, {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify({
      type: "signup",
      email,
      options: {
        emailRedirectTo: buildAbsoluteUrl(REDIRECT_PATH),
      },
    }),
  });
  await parseJson<Record<string, never>>(response);
}

export async function signOut(accessToken: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: authHeaders(accessToken),
  });
  await parseJson<Record<string, never>>(response);
}

export function getOAuthUrl(provider: "google" | "apple") {
  const url = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  url.searchParams.set("provider", provider);
  url.searchParams.set("redirect_to", buildAbsoluteUrl(REDIRECT_PATH));
  url.searchParams.set("flow_type", "implicit");
  return url.toString();
}

export async function updatePassword(accessToken: string, password: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ password }),
  });
  await parseJson<Record<string, never>>(response);
}

export async function isUsernameAvailable(username: string, accessToken?: string) {
  const normalized = normalizeUsername(username);
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/profile_usernames?username_normalized=eq.${encodeURIComponent(normalized)}&select=user_id&limit=1`,
    {
      headers: accessToken ? authHeaders(accessToken) : publicHeaders(),
    },
  );
  const data = await parseJson<Array<{ user_id: string }>>(response);
  return data.length === 0;
}

export async function fetchProfile(accessToken: string, userId: string) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=*`,
    { headers: authHeaders(accessToken) },
  );
  const data = await parseJson<FervetProfile[]>(response);
  return data[0] ?? null;
}

export async function upsertProfile(accessToken: string, profile: FervetProfile) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: authHeaders(accessToken, {
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify(profile),
  });
  const data = await parseJson<FervetProfile[]>(response);
  return data[0] ?? profile;
}

export async function uploadAvatar(accessToken: string, userId: string, file: File) {
  const sanitized = file.name.replace(/[^\w.-]/g, "-");
  const path = `${userId}/${Date.now()}-${sanitized}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      "x-upsert": "true",
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  await parseJson<Record<string, unknown>>(response);
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

export async function fetchUserAppState(accessToken: string, userId: string) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/user_app_state?user_id=eq.${userId}&select=data,updated_at&limit=1`,
    { headers: authHeaders(accessToken) },
  );
  const data = await parseJson<Array<{ data: AppState; updated_at: string }>>(response);
  return data[0] ?? null;
}

export async function upsertUserAppState(accessToken: string, userId: string, data: AppState) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/user_app_state`, {
    method: "POST",
    headers: authHeaders(accessToken, {
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify({
      user_id: userId,
      data,
      updated_at: new Date().toISOString(),
    }),
  });
  await parseJson<Array<{ user_id: string }>>(response);
}
