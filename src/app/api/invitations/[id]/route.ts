// /src/app/api/invitations/[id]/route.ts - Accept or Decline an Invitation
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { debugLog } from "../../../../utils/debug";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json();
    const invitationId = params.id;

    if (!invitationId || !['Accepted', 'Declined'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: { status }
    });

    if (status === 'Accepted') {
      const invitee = await prisma.user.findUnique({ where: { email: updatedInvitation.inviteeEmail } });

      if (!invitee) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Assign the invitee to the correct role
      if (updatedInvitation.role === 'Principal') {
        await prisma.holographPrincipal.create({
          data: {
            holographId: updatedInvitation.holographId,
            userId: invitee.id,
          }
        });
      } else if (updatedInvitation.role === 'Delegate') {
        await prisma.holographDelegate.create({
          data: {
            holographId: updatedInvitation.holographId,
            userId: invitee.id,
          }
        });
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
