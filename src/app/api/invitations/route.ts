// /src/app/api/invitations/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST: Send an invitation
export async function POST(request: Request) {
  try {
    console.log("🚀 /api/invitations endpoint hit!"); 

    const body = await request.json();
    console.log("📩 Raw API Request Data:", body);

    const { holographId, inviterId, inviteeEmail, role } = body;
    console.log("📩 Parsed API Request Data:", { holographId, inviterId, inviteeEmail, role });

    // ✅ Validate required fields
    if (!holographId || !inviterId || !inviteeEmail || !role) {
      console.error("❌ Missing required fields");
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ✅ Ensure `holographId` exists
    const holograph = await prisma.holograph.findUnique({
      where: { id: holographId },
      select: { id: true },
    });

    if (!holograph) {
      console.error(`❌ Holograph with ID ${holographId} not found`);
      return NextResponse.json({ error: 'Holograph not found' }, { status: 404 });
    }

    // ✅ Ensure `inviterId` exists
    const inviter = await prisma.user.findUnique({
      where: { id: inviterId },
      select: { id: true },
    });

    if (!inviter) {
      console.error(`❌ User with ID ${inviterId} (Inviter) not found`);
      return NextResponse.json({ error: 'Inviter not found' }, { status: 404 });
    }

    // ✅ Ensure `inviteeEmail` exists
    const invitee = await prisma.user.findUnique({
      where: { email: inviteeEmail },
      select: { id: true },
    });

    if (!invitee) {
      console.error(`❌ User with email ${inviteeEmail} not found`);
      return NextResponse.json({ error: 'User not found, please try again' }, { status: 404 });
    }

    console.log("✅ Final Data Before Prisma Query:", {
      holographId,
      inviterId,
      inviteeEmail,
      role,
    });

    // ✅ Ensure correct Prisma schema by explicitly connecting relations
    const invitationData = {
      holograph: { connect: { id: holographId } }, // Connect to existing Holograph
      inviter: { connect: { id: inviterId } }, // Connect to existing User
      inviteeEmail: inviteeEmail,
      role: role,
      status: "Pending",
    };

    console.log("📩 Sending data to Prisma:", invitationData);

    // ✅ Create the invitation
    const invitation = await prisma.invitation.create({
      data: invitationData,
    });

    console.log("✅ Invitation Created:", invitation);
    return NextResponse.json({ success: true, invitation });

  } catch (error: any) {
    console.error("❌ API Error in /api/invitations:", error);

    if (error.code) {
      console.error("🔍 Prisma Error Code:", error.code);
    }
    
    return NextResponse.json({ error: error.message || "Failed to send invitation" }, { status: 500 });
  }
}


// GET: Fetch invitations for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.error(`❌ User with ID ${userId} not found`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const invitations = await prisma.invitation.findMany({
      where: { inviteeEmail: user.email }
    });

    console.log(`✅ Retrieved ${invitations.length} invitations for ${user.email}`);
    return NextResponse.json(invitations);
  } catch (error: any) {
    console.error("❌ Error fetching invitations:", error);
    return NextResponse.json({ error: error.message || 'Failed to fetch invitations' }, { status: 500 });
  }
}

// PATCH: Accept or decline an invitation
export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();

    console.log(`📩 Updating Invitation ID: ${id} with status: ${status}`);

    if (!id || !['Accepted', 'Declined'].includes(status)) {
      console.error("❌ Invalid request data");
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const updatedInvitation = await prisma.invitation.update({
      where: { id },
      data: { status }
    });

    if (status === 'Accepted') {
      const invitee = await prisma.user.findUnique({ where: { email: updatedInvitation.inviteeEmail } });

      if (!invitee) {
        console.error(`❌ Invited user (${updatedInvitation.inviteeEmail}) not found`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      await prisma.holographPrincipal.create({
        data: {
          holographId: updatedInvitation.holographId,
          userId: invitee.id,
        }
      });

      console.log(`✅ User ${invitee.email} added as Principal to Holograph ${updatedInvitation.holographId}`);
    }

    return NextResponse.json(updatedInvitation);
  } catch (error: any) {
    console.error("❌ Error updating invitation:", error);
    return NextResponse.json({ error: error.message || 'Failed to update invitation' }, { status: 500 });
  }
}
