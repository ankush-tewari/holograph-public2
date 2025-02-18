import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'

export async function POST(req: Request) {
  try {
    console.log("API Request: /api/auth/login");

    // Parse request body
    const { email, password } = await req.json();
    console.log("Received credentials:", email);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("User not found");
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Validate password
    const isValid = await compare(password, user.password);
    if (!isValid) {
      console.log("Invalid password");
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT token
    const token = sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

    console.log("Generated token:", token);

    // Set cookie and return JSON response
    const response = NextResponse.json({ success: true, token });
    response.cookies.set('auth-token', token, { httpOnly: true, secure: true });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
