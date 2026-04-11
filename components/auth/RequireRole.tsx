"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/api/types";

export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || !roles.includes(user.role)) {
      router.replace("/connexion");
    }
  }, [user, loading, roles, router]);

  if (loading || !user || !roles.includes(user.role)) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-zinc-500">
        Chargement…
      </div>
    );
  }

  return <>{children}</>;
}
