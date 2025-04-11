import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 debug-session handler called");
    const session = await getServerSession(await getAuthOptions());
    console.log("✅ Session loaded:", session);

    return new Response(JSON.stringify({ session }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ debug-session crashed:", err.message, err.stack);
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
