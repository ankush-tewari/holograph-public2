// /src/app/api/invitations/[id]/route.ts - Accept or Decline an Invitation

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { debugLog } from '@/utils/debug';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
 
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    const invitationId = params.id;

    const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // ✅ Validate inviteeId matches session user
    if (invitation.inviteeId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden — invitee mismatch' }, { status: 403 });
    }

    if (!invitationId || !['Accepted', 'Declined'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: { status }
    });

    if (status === 'Accepted') {
      const inviteeId = invitation.inviteeId;
      if (!inviteeId) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Assign the invitee to the correct role
      if (updatedInvitation.role === 'Principal') {
        await prisma.holographPrincipal.create({
          data: {
            holographId: updatedInvitation.holographId,
            userId: inviteeId,
          }
        });
      } else if (updatedInvitation.role === 'Delegate') {
        await prisma.holographDelegate.create({
          data: {
            holographId: updatedInvitation.holographId,
            userId: inviteeId,
          }
        });
      
        // ✅ Fetch all sections for this Holograph
        const sections = await prisma.holographSection.findMany({
          where: { holographId: updatedInvitation.holographId },
          select: { id: true },
        });
      
        // ✅ Create default permissions: "view-only"
        await prisma.delegatePermissions.createMany({
          data: sections.map((section) => ({
            holographId: updatedInvitation.holographId,
            delegateId: inviteeId,
            sectionId: section.id,
            accessLevel: "view-only",
          })),
        });
      
        debugLog(`✅ Default 'view-only' permissions created for Delegate ${inviteeId}`);
      }      
    }

    if (status === 'Declined') {
      await prisma.invitation.delete({ where: { id: invitationId } });
    }

    return NextResponse.json(updatedInvitation);
  } catch (error) {
    console.error('Error updating invitation:', error);
    return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 });
  }
}
