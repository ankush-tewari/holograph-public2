// src/app/api/debug-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 API Route: Getting session debug info");
    
    // Get the current session on the server side
    const session = await getServerSession(authOptions);
    console.log("🔍 Session in debug API:", session);
    
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