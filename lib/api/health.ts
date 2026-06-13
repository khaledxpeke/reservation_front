import { getApiBaseUrl } from "@/lib/api/baseUrl";

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Health check failed");
  return res.json() as Promise<HealthResponse>;
}
