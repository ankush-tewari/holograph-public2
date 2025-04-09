// src/utils/withCors.ts

import { NextRequest, NextResponse } from "next/server";

export const allowedOrigins = [
  "http://localhost:3000",
  "https://holograph-git-migrate-auth-to-vercel-ankushs-projects-31477be9.vercel.app",
  "https://www.holographcompany.com",
];

export function getCorsHeaders(origin: string): Record<string, string> {
  const allowOrigin = allowedOrigins.includes(origin) ? origin : "";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

export function withCors<T extends Request | NextRequest>(
    handler: (req: T) => Promise<Response | NextResponse>
  ) {
    return async function wrappedHandler(req: T): Promise<Response | NextResponse> {
      const res = await handler(req);
      const origin = req.headers.get("origin") || "";
      const headers = getCorsHeaders(origin);
  
      for (const [key, value] of Object.entries(headers)) {
        res.headers.set(key, value);
      }
  
      return res;
    };
  }
  
