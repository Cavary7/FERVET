import { AppState } from "@/lib/types";

export const STORAGE_KEY = "fervet:v1";
export const AUTH_SESSION_STORAGE_KEY = "fervet:auth-session";

export function getAccountStorageKey(userId: string) {
  return `${STORAGE_KEY}:account:${userId}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadState<T>(fallback: T): T {
  return readJson(STORAGE_KEY, fallback);
}

export function saveState(state: AppState) {
  writeJson(STORAGE_KEY, state);
}

export function loadAccountState<T>(userId: string, fallback: T) {
  return readJson(getAccountStorageKey(userId), fallback);
}

export function saveAccountState(userId: string, state: AppState) {
  writeJson(getAccountStorageKey(userId), state);
}

export function removeStorageKey(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export function loadAuthSession<T>(fallback: T): T {
  return readJson(AUTH_SESSION_STORAGE_KEY, fallback);
}

export function saveAuthSession(session: unknown) {
  writeJson(AUTH_SESSION_STORAGE_KEY, session);
}
