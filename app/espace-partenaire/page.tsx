"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EspacePartenaireRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/espace-partenaire/reservations");
  }, [router]);
  return null;
}
