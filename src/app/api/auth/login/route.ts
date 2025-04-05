// /src/app/api/auth/login/route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs"; // ✅ Use consistent bcrypt import
import jwt from "jsonwebtoken"; // ✅ Ensure jsonwebtoken is imported
import { debugLog } from "@/utils/debug";

export async function POST(req: Request) {
  try {
    debugLog("API Request: /api/auth/login");

    // ✅ Parse request body
    const { email, password } = await req.json();
    debugLog("🔍 Received credentials:", email);

    // ✅ Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      debugLog("❌ User not found or missing password");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // ✅ Validate password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      debugLog("❌ Invalid password");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // ✅ Generate JWT token using NEXTAUTH_SECRET
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.NEXTAUTH_SECRET!, // ✅ Ensure this matches verification secret
      { expiresIn: "7d" } // ✅ 7-day expiration
    );

    debugLog("🔑 JWT Created With NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET);
    debugLog("✅ Generated token:", token);

    // ✅ Set HTTP-only Secure Cookie
    const response = NextResponse.json({ success: true });

    response.headers.append("Access-Control-Allow-Credentials", "true");
    response.headers.append("Access-Control-Allow-Origin", "http://localhost:3000"); // ✅ Allow frontend in dev

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ✅ Set `true` in production
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
