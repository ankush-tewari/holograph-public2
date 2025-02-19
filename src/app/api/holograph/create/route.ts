import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verify, JwtPayload } from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    console.log("🚀 Received request to create holograph");

    // 🔍 Log received cookies
    console.log("🔍 Received Cookies:", request.headers.get('cookie'));

    // ✅ Manually extract `auth-token`
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const authToken = cookies['auth-token'];

    console.log("🔑 Extracted Token:", authToken);

    let session = null;

    if (authToken) {
      try {
        // ✅ Verify the JWT token
        console.log("🔍 Decoding JWT with secret:", process.env.JWT_SECRET);
        const decoded = verify(authToken, process.env.JWT_SECRET!);

        if (typeof decoded === 'object' && 'id' in decoded && 'email' in decoded) {
          console.log("✅ Token successfully decoded:", decoded);
          session = { user: { id: decoded.id, email: decoded.email } };
        } else {
          console.log("❌ Decoded token does not contain expected fields:", decoded);
        }
      } catch (err) {
        console.log("❌ Token verification failed:", err);
      }
    }

    // ✅ Fallback: Try NextAuth session if JWT failed
    if (!session) {
      console.log("🔄 Trying getServerSession as a fallback...");
      session = await getServerSession(authOptions);
    }

    console.log("🔑 Final Session:", session);

    if (!session || !session.user?.id) {
      console.error("❌ Unauthorized - No session found!");
      return NextResponse.json({ error: 'Unauthorized - Session not found' }, { status: 401 });
    }

    console.log("✅ Session verified. User ID:", session.user.id);

    // Extract request data
    const { title } = await request.json();
    console.log("📌 Received request with title:", title);

    // Validate input
    if (!title) {
      console.log("❌ No title provided.");
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // ✅ Create holograph and principal relationship in a transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log("✅ Creating holograph for user:", session.user.id);

      const holograph = await tx.holograph.create({
        data: { title },
      });

      console.log("✅ Creating principal relationship.");
      await tx.holographPrincipal.create({
        data: {
          userId: session.user.id,
          holographId: holograph.id,
        },
      });

      return holograph;
    });

    console.log("🎉 Successfully created holograph:", result);
    
    // ✅ Response with proper CORS headers
    const response = NextResponse.json({
      id: result.id,
      title: result.title,
      lastModified: result.updatedAt.toISOString(),
    });

    response.headers.append('Access-Control-Allow-Credentials', 'true');
    response.headers.append('Access-Control-Allow-Origin', 'http://localhost:3000'); // Adjust for production
    response.headers.append('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');

    return response;
  } catch (error: any) {
    console.error("❌ Detailed error creating holograph:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to create holograph' },
      { status: 500 }
    );
  }
}
