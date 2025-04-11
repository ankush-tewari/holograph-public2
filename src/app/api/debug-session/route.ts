import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    console.log("🧪 [debug-session] Starting route");

    const options = await getAuthOptions();
    console.log("✅ [debug-session] gotAuthOptions");

    const session = await getServerSession(options);
    console.log("✅ [debug-session] session loaded:", session);

    return new Response(JSON.stringify({
      success: true,
      session,
      providersCount: options.providers.length,
      sessionStrategy: options.session?.strategy,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("❌ [debug-session] error:", err);
    return new Response(
      JSON.stringify({
        error: err.message,
        stack: err.stack,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
