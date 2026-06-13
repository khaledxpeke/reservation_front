import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },

  /** Les appels `/api/*` → proxy dans `app/api/[...path]/route.ts` (NEXT_PUBLIC_API_URL = backend). */

  async redirects() {
    return [
      { source: "/jouer", destination: "/annonces", permanent: true },
      { source: "/jouer/nouveau", destination: "/annonces/nouveau", permanent: true },
      { source: "/jouer/:id", destination: "/annonces/:id", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
