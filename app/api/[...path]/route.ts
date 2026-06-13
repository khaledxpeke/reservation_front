import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

/** Headers that must not be copied to the upstream fetch (Node / undici). */
const HOP_BY_HOP = new Set([
  "connection",
  "content-length",
  "keep-alive",
  "transfer-encoding",
  "te",
  "trailer",
  "upgrade",
  "host",
]);

async function proxy(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path: segments = [] } = await ctx.params;
  const subpath = segments.length ? segments.join("/") : "";
  const target = subpath ? `${BACKEND}/api/${subpath}${req.nextUrl.search}` : `${BACKEND}/api${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
    init.duplex = "half";
  }

  let res: Response;
  try {
    res = await fetch(target, init);
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "API indisponible. Démarrez le backend (ex. port 4000) ou vérifiez NEXT_PUBLIC_API_URL dans .env.local.",
      },
      { status: 502 },
    );
  }

  const out = new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
  });
  res.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      out.headers.set(key, value);
    }
  });
  return out;
}

export function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export function POST(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export function PUT(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export function PATCH(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export function DELETE(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export function OPTIONS(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
