// src/app/api/debug-session/route.ts

import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    console.log("🐛 Debug Session Route Hit");

    const options = await getAuthOptions();
    console.log("✅ Loaded Auth Options");

    const session = await getServerSession(options);
    console.log("✅ Session Loaded:", session);

    return new Response(JSON.stringify({ session }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ Error in /api/debug-session:", err);

    return new Response(
      JSON.stringify({
        error: err.message || "Unknown error",
        stack: err.stack,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
