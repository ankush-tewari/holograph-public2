// /src/app/api/debug-session/route.ts
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authOptions = await getAuthOptions();
    const session = await getServerSession(authOptions);
    return NextResponse.json({ session });
  } catch (err: any) {
    console.error("❌ DEBUG SESSION ERROR:", err.message || err);
    return NextResponse.json({ error: err.message || "Session error" }, { status: 500 });
  }
}
