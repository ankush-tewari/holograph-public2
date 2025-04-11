import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Add a function to test database connectivity
async function testDatabaseConnection() {
  try {
    const userCount = await prisma.user.count();
    return { success: true, userCount };
  } catch (error: any) {
    console.error("❌ Database connection test failed:", error.message);
    return { success: false, error: error.message };
  }
}

export async function POST(req: NextRequest) {
  console.log("🚀 POST hit:", req.nextUrl.pathname);
  
  try {
    // Check if this is the credentials endpoint
    const isCredentialsAuth = req.nextUrl.pathname.includes('/callback/credentials');
    
    if (isCredentialsAuth) {
      console.log("⚠️ Credentials authentication attempt");
      
      // Test database connection before proceeding
      const dbTest = await testDatabaseConnection();
      if (!dbTest.success) {
        console.error("❌ Database connection failed during auth attempt:", dbTest.error);
      } else {
        console.log("✅ Database connection successful, user count:", dbTest.userCount);
      }
      
      // Try to parse the request body for debugging (without logging passwords)
      try {
        const body = await req.clone().json();
        console.log("📝 Auth request includes email:", body.email ? "Yes" : "No");
      } catch (e) {
        console.log("⚠️ Could not parse request body");
      }
    }
    
    // Get auth options and process the request
    const options = await getAuthOptions();
    console.log("✅ Got auth options");
    return await NextAuth(options).POST!(req);
  } catch (err: any) {
    console.error("❌ AUTH POST CRASHED:", err.message);
    console.error("Stack trace:", err.stack);
    
    // Check database connectivity when auth fails
    console.log("🧪 Testing database connection after auth failure");
    const dbTest = await testDatabaseConnection();
    console.log("Database test result:", dbTest);
    
    return new Response(
      JSON.stringify({ 
        error: err.message, 
        stack: err.stack,
        databaseTest: dbTest
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET(req: NextRequest) {
  console.log("🟢 [auth] GET called:", req.nextUrl.pathname);
  
  try {
    // Check if we're doing a session check
    const isSessionCheck = req.nextUrl.pathname.includes('/session');
    if (isSessionCheck) {
      console.log("🧪 Session check request");
      
      // Test database connection for session checks
      const dbTest = await testDatabaseConnection();
      console.log("Database connection for session:", dbTest.success ? "OK" : "FAILED");
    }
    
    const options = await getAuthOptions();
    const res = await NextAuth(options).GET!(req);
    console.log("✅ [auth] GET success");
    return res;
  } catch (err: any) {
    console.error("❌ [auth] GET error:", err.message);
    console.error("Stack trace:", err.stack);
    
    // Check database connectivity when session check fails
    const dbTest = await testDatabaseConnection();
    
    return new Response(
      JSON.stringify({ 
        error: err.message, 
        stack: err.stack,
        databaseTest: dbTest
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}