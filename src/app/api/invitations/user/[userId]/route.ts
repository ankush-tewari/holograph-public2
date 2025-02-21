import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: params.userId } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get pending invitations for the user
    const invitations = await prisma.invitation.findMany({
      where: {
        inviteeEmail: user.email,
        status: 'Pending',
      },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}
