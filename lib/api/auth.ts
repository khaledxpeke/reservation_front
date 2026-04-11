import { apiRequest, tokenStorage, setStoredUser } from "@/lib/api/client";
import type { AuthUser, LoginResult } from "@/lib/api/types";

export interface RegisterBody {
  email: string;
  password: string;
  name: string;
  city: string;
  phone: string;
  address?: string;
  categoryId: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export async function registerPartner(body: RegisterBody): Promise<LoginResult> {
  const data = await apiRequest<LoginResult>("/api/auth/register", {
    method: "POST",
    body,
    auth: false,
  });
  persistSession(data);
  return data;
}

export async function login(body: LoginBody): Promise<LoginResult> {
  const data = await apiRequest<LoginResult>("/api/auth/login", {
    method: "POST",
    body,
    auth: false,
  });
  persistSession(data);
  return data;
}

function persistSession(data: LoginResult) {
  tokenStorage.setTokens(data.accessToken, data.refreshToken);
  setStoredUser(JSON.stringify(data.user));
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    await apiRequest<{ message: string }>("/api/auth/logout", {
      method: "POST",
      body: { refreshToken },
    });
  } finally {
    tokenStorage.clear();
  }
}

export async function refreshSession(refreshToken: string) {
  return apiRequest<{ accessToken: string; refreshToken: string }>("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    auth: false,
  });
}

export function hydrateUserFromStorage(): AuthUser | null {
  const raw = typeof window !== "undefined" ? localStorage.getItem("padel_user") : null;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
