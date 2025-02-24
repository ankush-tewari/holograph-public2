// /src/app/api/auth/user/route.ts

import { NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    console.log("API Request: /api/auth/user");

    // ✅ Correct way to get cookies in Next.js App Router
    const cookieStore = await cookies(); // ✅ Do NOT use `await`
    const tokenCookie = cookieStore.get("auth-token"); // ✅ Correct usage

    if (!tokenCookie) {
      console.error("❌ No auth token found");
      return NextResponse.json({ error: "No auth token found" }, { status: 401 });
  }

    console.log("Token found:", tokenCookie);


    // Verify the token
    const decoded = verify(tokenCookie.value, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };

    console.log("Decoded token:", decoded);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
