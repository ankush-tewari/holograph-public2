import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("🚀 POST hit:", req.nextUrl.pathname);
  try {
    const options = await getAuthOptions();
    console.log("✅ Got auth options");
    return await NextAuth(options).POST!(req);
  } catch (err: any) {
    console.error("❌ AUTH POST CRASHED:", err.message, err.stack);
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


export async function GET(req: NextRequest) {
  console.log("🟢 [auth] GET called:", req.nextUrl.pathname);
  try {
    const options = await getAuthOptions();
    const res = await NextAuth(options).GET!(req);
    console.log("✅ [auth] GET success");
    return res;
  } catch (err: any) {
    console.error("❌ [auth] GET error:", err);
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
