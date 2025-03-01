// src/app/api/holograph/[id]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error("❌ No authenticated session found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Keep existing URL params logic for backward compatibility
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');
    
    // Log both session user and query user if different
    if (queryUserId && queryUserId !== userId) {
      console.log(`⚠️ Note: Query userId (${queryUserId}) differs from session userId (${userId}). Using session userId.`);
    }

    // ✅ Await params before using it
    const { id: holographId } = await context.params; 

    console.log(`🔍 Fetching Holograph ${holographId} for user ${userId}`);

    // ✅ Fetch Holograph with Principals & Delegates
    const holograph = await prisma.holograph.findUnique({
      where: { id: holographId },
      select: {
        id: true,
        title: true,
        createdAt: true,  // ✅ Ensure this is included
        updatedAt: true,  // ✅ Ensure this is included
        principals: { select: { userId: true } },
        delegates: { select: { userId: true } },
      },
    });

    if (!holograph) {
      console.error(`❌ Holograph ${holographId} not found`);
      return NextResponse.json({ error: "Holograph not found" }, { status: 404 });
    }

    console.log(`✅ Found Holograph: ${holograph.title}`);

    // ✅ Fetch the first Principal as the "owner"
    const ownerId = holograph.principals.length > 0 ? holograph.principals[0].userId : null;
    const owner = ownerId
      ? await prisma.user.findUnique({
          where: { id: ownerId },
          select: { id: true, name: true },
        })
      : null;

    console.log(`👤 Owner Found: ${owner?.name || "Unknown User"}`);

    // ✅ Check if the user is authorized
    const isAuthorized =
      holograph.principals.some(p => p.userId === userId) ||
      holograph.delegates.some(d => d.userId === userId);

    if (isAuthorized) {
      console.log(`✅ User ${userId} is authorized to view full Holograph ${holographId}`);
      return NextResponse.json({
        id: holograph.id,
        title: holograph.title,
        lastModified: holograph.updatedAt.toISOString(),
        owner: owner ? { id: owner.id, name: owner.name || "Unknown User" } : null,
      });
    }

    // 🚨 If user is not a Principal or Delegate, check for an invitation
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.error(`❌ User ${userId} not found in database`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`🔍 Checking invitation for ${user.email} to Holograph ${holographId}`);

    const invitation = await prisma.invitation.findFirst({
      where: {
        holographId: holographId,
        inviteeEmail: user.email,
        status: "Pending",
      },
    });

    if (invitation) {
      console.log(`🔹 User ${userId} has an invitation to Holograph ${holographId}. Returning limited data.`);
      return NextResponse.json({
        id: holograph.id,
        title: holograph.title, // Only return the title if invited
        owner: owner ? { id: owner.id, name: owner.name || "Unknown User" } : null,
      });
    }

    console.error(`❌ Unauthorized access: User ${userId} is not a Principal, Delegate, or Invitee`);
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });

  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}