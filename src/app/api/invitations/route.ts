// /src/app/api/invitations/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST: Send an invitation
export async function POST(request: Request) {
  try {
    const { holographId, inviterId, inviteeEmail, role } = await request.json();

    if (!holographId || !inviterId || !inviteeEmail || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if the invitee exists
    const invitee = await prisma.user.findUnique({ where: { email: inviteeEmail } });
    if (!invitee) {
      return NextResponse.json({ error: 'User not found, please try again' }, { status: 404 });
    }

    // Create an invitation
    const invitation = await prisma.invitation.create({
      data: { holographId, inviterId, inviteeEmail, role }
    });

    return NextResponse.json(invitation);
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
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

    const invitations = await prisma.invitation.findMany({
      where: { inviteeEmail: (await prisma.user.findUnique({ where: { id: userId } }))?.email }
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}

// PATCH: Accept or decline an invitation
export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !['Accepted', 'Declined'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const updatedInvitation = await prisma.invitation.update({
      where: { id },
      data: { status }
    });

    if (status === 'Accepted') {
        const invitee = await prisma.user.findUnique({ where: { email: updatedInvitation.inviteeEmail } });
      
        if (!invitee) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
      
        await prisma.holographPrincipal.create({
          data: {
            holographId: updatedInvitation.holographId,
            userId: invitee.id,
          }
        });
      }

    return NextResponse.json(updatedInvitation);
  } catch (error) {
    console.error('Error updating invitation:', error);
    return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 });
  }
}
