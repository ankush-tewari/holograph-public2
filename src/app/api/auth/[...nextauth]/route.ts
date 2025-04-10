// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from 'next-auth';
import { debugLog } from '@/utils/debug';
import { getAuthOptions } from '@/lib/auth';

export const runtime = "nodejs"; // force node runtime for auth
export const dynamic = "force-dynamic"; // ensure server-only behavior

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

const handler = async (...args: any[]) => {
  try {
    debugLog("📦 Loading auth handler dynamically");
    const authOptions = await getAuthOptions();
    return NextAuth(authOptions)(...args);
  } catch (err) {
    console.error("❌ AUTH ROUTE FAILED:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};

const authHandler = await handler();
export { authHandler as GET, authHandler as POST };
