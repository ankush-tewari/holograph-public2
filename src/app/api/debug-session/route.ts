import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("🟢 [auth route] GET", req.nextUrl.pathname);
  const options = await getAuthOptions();
  return await NextAuth(options).GET!(req);
}

export async function POST(req: NextRequest) {
  console.log("🟠 [auth route] POST", req.nextUrl.pathname);
  const options = await getAuthOptions();
  return await NextAuth(options).POST!(req);
}
