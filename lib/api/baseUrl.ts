/** Backend origin (no trailing slash). Set NEXT_PUBLIC_API_URL in Vercel / .env.local. */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
}
