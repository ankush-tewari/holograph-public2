// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { debugLog } from '@/utils/debug';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

console.log("🔑 NextAuth Route Handler - Environment Check:", {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "Not set",
  NODE_ENV: process.env.NODE_ENV,
  HAS_DATABASE_URL: !!process.env.DATABASE_URL,
});

debugLog("🔑 NextAuth Route Handler - Environment Check:", {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "Not set",
  NODE_ENV: process.env.NODE_ENV,
  HAS_DATABASE_URL: !!process.env.DATABASE_URL,
});

const handler = async (req: Request) => {
  const options = await getAuthOptions();
  const { pathname } = new URL(req.url);
  const method = req.method;

  // Manually forward request to correct method handler
  if (method === "GET") {
    return NextAuth(options).GET!(req);
  } else if (method === "POST") {
    return NextAuth(options).POST!(req);
  } else {
    return new Response("Method not allowed", { status: 405 });
  }
};

export { handler as GET, handler as POST };
