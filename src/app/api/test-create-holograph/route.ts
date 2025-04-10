// /src/app/api/test-create-holograph/route.ts

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    console.log("✅ POST hit at /api/test-create-holograph");
    return NextResponse.json({
      success: true,
      message: "POST method is working!",
      body,
    });
  } catch (err: any) {
    console.error("❌ POST failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "GET working! This route is alive.",
    timestamp: new Date().toISOString(),
  });
}
