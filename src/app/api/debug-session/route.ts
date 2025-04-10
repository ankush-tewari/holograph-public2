import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    console.log("🧪 [debug-session] Request headers:", Object.fromEntries(req.headers.entries()));

    const options = await getAuthOptions();
    const session = await getServerSession(options);

    console.log("🧪 [debug-session] Loaded session:", session);

    return new Response(JSON.stringify({ session }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ [debug-session] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error", stack: err.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
