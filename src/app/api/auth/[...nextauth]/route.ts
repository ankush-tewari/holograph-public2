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

export async function GET(req: Request) {
  const options = await getAuthOptions();
  return await NextAuth(options).GET!(req);
}

export async function POST(req: Request) {
  const options = await getAuthOptions();
  return await NextAuth(options).POST!(req);
}
