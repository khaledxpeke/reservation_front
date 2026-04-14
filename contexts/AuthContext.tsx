"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  registerPartner,
  hydrateUserFromStorage,
} from "@/lib/api/auth";
import { setStoredUser, tokenStorage } from "@/lib/api/client";
import type { AuthUser, LoginResult } from "@/lib/api/types";
import type { LoginBody, RegisterBody } from "@/lib/api/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (body: LoginBody) => Promise<LoginResult>;
  register: (body: RegisterBody) => Promise<LoginResult>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setUser(hydrateUserFromStorage());
      setLoading(false);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const login = useCallback(async (body: LoginBody) => {
    const result = await apiLogin(body);
    setUser(result.user);
    setStoredUser(JSON.stringify(result.user));
    return result;
  }, []);

  const register = useCallback(async (body: RegisterBody) => {
    const result = await registerPartner(body);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    const rt = tokenStorage.getRefresh();
    try {
      if (rt) await apiLogout(rt);
      else tokenStorage.clear();
    } catch {
      tokenStorage.clear();
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
