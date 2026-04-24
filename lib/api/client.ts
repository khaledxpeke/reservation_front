import { ApiError, type ApiErrorBody } from "@/lib/api/types";

const ACCESS = "padel_access_token";
const REFRESH = "padel_refresh_token";
const USER = "padel_user";

/**
 * On the client side, API calls go through the Next.js rewrite (/api/* -> backend).
 * On the server side (SSR/RSC), we call the backend directly.
 */
function resolveBase(): string {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
}

export const tokenStorage = {
  getAccess: () =>
    typeof window !== "undefined" ? localStorage.getItem(ACCESS) : null,
  getRefresh: () =>
    typeof window !== "undefined" ? localStorage.getItem(REFRESH) : null,
  setTokens(access: string, refresh: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER);
  },
};

export function setStoredUser(json: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER, json);
}

export function getStoredUserJson(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER);
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

interface RawSuccess<T> {
  success: true;
  data: T;
}

interface RawFail {
  success: false;
  error: ApiErrorBody;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return false;
  const base = resolveBase();
  const res = await fetch(`${base}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  const json = (await res.json()) as RawSuccess<{ accessToken: string; refreshToken: string }> | RawFail;
  if (!res.ok || !("success" in json) || !json.success) {
    tokenStorage.clear();
    // If the account was blocked mid-session, redirect to login with a flag
    if (!json.success && json.error?.code === "ACCOUNT_BLOCKED" && typeof window !== "undefined") {
      window.location.href = "/connexion?bloque=1";
    }
    return false;
  }
  tokenStorage.setTokens(json.data.accessToken, json.data.refreshToken);
  return true;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true } = options;
  const base = resolveBase();
  const url = `${base}${path}${query ? buildQuery(query) : ""}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) {
    const token = tokenStorage.getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  };

  let res = await fetch(url, fetchOptions);

  if (res.status === 401 && auth && tokenStorage.getRefresh()) {
    const ok = await tryRefresh();
    if (ok) {
      const t = tokenStorage.getAccess();
      if (t) headers.Authorization = `Bearer ${t}`;
      res = await fetch(url, { ...fetchOptions, headers });
    }
  }

  const json = (await res.json()) as RawSuccess<T> | RawFail;

  if (!res.ok || !json.success) {
    const err = json as RawFail;
    const code = err.success === false ? err.error.code : "HTTP_ERROR";
    const message =
      err.success === false ? err.error.message : `Erreur HTTP ${res.status}`;
    const details = err.success === false ? err.error.details : undefined;
    throw new ApiError(res.status, code, message, details);
  }

  return json.data;
}
