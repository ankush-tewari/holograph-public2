import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    console.log("🧪 [debug-session] Starting route");

    // Check environment variables
    const envCheck = {
      nodeEnv: process.env.NODE_ENV,
      databaseUrlSet: !!process.env.DATABASE_URL,
      databaseUrl: process.env.DATABASE_URL?.substring(0, 10) + "...", // Only show beginning for security
      nextAuthUrlSet: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nextAuthSecretSet: !!process.env.NEXTAUTH_SECRET, 
      jwtSecretSet: !!process.env.JWT_SECRET,
      googleClientIdSet: !!process.env.GOOGLE_CLIENT_ID,
      googleClientSecretSet: !!process.env.GOOGLE_CLIENT_SECRET
    };
    console.log("✅ [debug-session] Environment check:", envCheck);

    // Test database connection
    let dbStatus = { success: false, error: null, userCount: 0 };
    try {
      const userCount = await prisma.user.count();
      dbStatus = { success: true, error: null, userCount };
      console.log("✅ [debug-session] Database connection successful, user count:", userCount);
    } catch (dbError: any) {
      dbStatus = { success: false, error: dbError.message, userCount: 0 };
      console.error("❌ [debug-session] Database connection error:", dbError);
    }

    // Get auth session
    const options = await getAuthOptions();
    console.log("✅ [debug-session] gotAuthOptions");

    const session = await getServerSession(options);
    console.log("✅ [debug-session] session loaded:", session);

    return new Response(JSON.stringify({
      success: true,
      environment: envCheck,
      database: dbStatus,
      session,
      authConfig: {
        providersCount: options.providers.length,
        sessionStrategy: options.session?.strategy,
        callbacksConfigured: !!options.callbacks
      },
      timestamp: new Date().toISOString()
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
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}