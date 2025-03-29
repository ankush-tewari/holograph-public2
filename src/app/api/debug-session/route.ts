// src/app/api/debug-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { debugLog } from '@/utils/debug';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }
  try {
    debugLog("🔍 API Route: Getting session debug info");
    
    // Get the current session on the server side
    const session = await getServerSession(authOptions);
    debugLog("🔍 Session in debug API:", session);
    
    // Return the session data for debugging
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session,
      message: "Current server-side session state"
    });
  } catch (error) {
    console.error("❌ Error in session debug endpoint:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}