// /src/app/api/invitations/user/[userId]/route.ts  not sure if this is used.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/auth';
import { prisma } from '@/lib/db';
import { debugLog } from "../../../../../utils/debug";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    debugLog("🔍 Fetching invitations for userId:", params.userId);

    // Get authenticated user from session
    const session = await getServerSession(authOptions);
    debugLog("🔍 Session in API route:", session);
    
    if (!session || !session.user || !session.user.id) {
      debugLog("❌ No authenticated user found in session");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const authenticatedUserId = session.user.id;
    const requestedUserId = params.userId;
    
    // Security check: Make sure the authenticated user is only accessing their own invitations
    if (authenticatedUserId !== requestedUserId) {
      debugLog("⚠️ Security warning: User attempted to access another user's invitations");
      debugLog("Authenticated user:", authenticatedUserId, "Requested user:", requestedUserId);
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    if (!params.userId) {
      console.error("❌ Error: userId is missing in request");
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Validate user existence
    const user = await prisma.user.findUnique({ where: { id: params.userId } });

    if (!user) {
      console.error(`❌ User with ID ${params.userId} not found`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch pending invitations for the user
    const invitations = await prisma.invitation.findMany({
      where: {
        inviteeEmail: user.email,
        status: 'Pending',
      },
      include: {
        holograph: {
          select: {
            title: true,
          }
        },
        inviter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    // Format the invitations to include holograph title and inviter name
    const formattedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      holographId: invitation.holographId,
      inviterId: invitation.inviterId,
      role: invitation.role,
      status: invitation.status,
      holographTitle: invitation.holograph.title,
      inviterFirstName: invitation.inviter.firstName,
      inviterLastName: invitation.inviter.lastName,
    }));

    debugLog(`✅ Found ${invitations.length} invitations for user ${user.email}`);
    
    return NextResponse.json(formattedInvitations);
  } catch (error) {
    console.error('❌ Error fetching invitations:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}