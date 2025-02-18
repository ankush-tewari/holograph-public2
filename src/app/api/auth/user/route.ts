import { NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    console.log("API Request: /api/auth/user");

    // ✅ Await cookies() before accessing values
    const cookieStore = cookies();
    const token = await cookieStore.get('auth-token');

    console.log("Token found:", token);

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = verify(token.value, process.env.JWT_SECRET!) as {
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
