// src/app/api/debug-session/route.ts

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '@/lib/auth';
import { debugLog } from '@/utils/debug';

export async function GET(req: NextRequest) {
  // Remove the production block to allow testing in production
  try {
    debugLog("🔍 API Route: Getting session and DB connection debug info");
    console.log("🔍 API Route: Getting session and DB connection debug info");
    
    // Log environment variables
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      NEXTAUTH_URL_EXISTS: !!process.env.NEXTAUTH_URL,
      NEXT_PUBLIC_API_URL_EXISTS: !!process.env.NEXT_PUBLIC_API_URL,
    };
    
    debugLog("Environment variables:", env);
    console.log("Environment variables:", env);
    
    // Test database connection explicitly
    let dbStatus = "unknown";
    try {
      const { prisma } = await import("@/lib/db");
      await prisma.$connect();
      dbStatus = "connected";
      debugLog("✅ Database connection successful");
      console.log("✅ Database connection successful");
    } catch (error) {
      dbStatus = "failed";
      debugLog("❌ Database connection failed:", error);
      console.log("❌ Database connection failed:", error);
    }
    
    // Try to get the session (this may fail if DB connection fails)
    let session = null;
    let sessionError = null;
    try {
      session = await getServerSession(await getAuthOptions());
      debugLog("🔍 Session in debug API:", session);
      console.log("🔍 Session in debug API:", session);
    } catch (error) {
      sessionError = error.message;
      debugLog("❌ Session retrieval error:", error);
      console.log("❌ Session retrieval error:", error);
    }
    
    // Return all debug info
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: env,
      database: {
        status: dbStatus
      },
      session: session || null,
      sessionError: sessionError,
      message: "Debug information"
    });
  } catch (error) {
    console.error("❌ Error in debug endpoint:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}