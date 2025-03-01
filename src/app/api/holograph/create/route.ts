import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verify, JwtPayload } from 'jsonwebtoken';
import { debugLog } from "../../../../utils/debug";

export async function POST(request: Request) {
  try {
    debugLog("🚀 Received request to create holograph");

    // 🔍 Log received cookies
    debugLog("🔍 Received Cookies:", request.headers.get('cookie'));

    // ✅ Manually extract `auth-token`
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const authToken = cookies['auth-token'];

    debugLog("🔑 Extracted Token:", authToken);

    let session = null;

    if (authToken) {
      try {
        // ✅ Verify the JWT token
        debugLog("🔍 Decoding JWT with secret:", process.env.JWT_SECRET);
        const decoded = verify(authToken, process.env.JWT_SECRET!);

        if (typeof decoded === 'object' && 'id' in decoded && 'email' in decoded) {
          debugLog("✅ Token successfully decoded:", decoded);
          session = { user: { id: decoded.id, email: decoded.email } };
        } else {
          debugLog("❌ Decoded token does not contain expected fields:", decoded);
        }
      } catch (err) {
        debugLog("❌ Token verification failed:", err);
      }
    }

    // ✅ Fallback: Try NextAuth session if JWT failed
    if (!session) {
      debugLog("🔄 Trying getServerSession as a fallback...");
      session = await getServerSession(authOptions);
    }

    debugLog("🔑 Final Session:", session);

    if (!session || !session.user?.id) {
      console.error("❌ Unauthorized - No session found!");
      return NextResponse.json({ error: 'Unauthorized - Session not found' }, { status: 401 });
    }

    debugLog("✅ Session verified. User ID:", session.user.id);

    // Extract request data
    const { title } = await request.json();
    debugLog("📌 Received request with title:", title);

    // Validate input
    if (!title) {
      debugLog("❌ No title provided.");
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // ✅ Create holograph and principal relationship in a transaction
    const result = await prisma.$transaction(async (tx) => {
      debugLog("✅ Creating holograph for user:", session.user.id);

      const holograph = await tx.holograph.create({
        data: { title },
      });

      debugLog("✅ Creating principal relationship.");
      await tx.holographPrincipal.create({
        data: {
          userId: session.user.id,
          holographId: holograph.id,
        },
      });

      return holograph;
    });

    debugLog("🎉 Successfully created holograph:", result);
    
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
