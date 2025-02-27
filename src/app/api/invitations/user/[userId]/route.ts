// /src/app/api/invitations/user/[userId]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } } // ✅ Correct way to destructure `params`
) {
  try {
    console.log("🔍 Fetching invitations for userId:", params.userId);

    if (!params.userId) {
      console.error("❌ Error: userId is missing in request");
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // ✅ Validate user existence
    const user = await prisma.user.findUnique({ where: { id: params.userId } });

    if (!user) {
      console.error(`❌ User with ID ${params.userId} not found`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ✅ Fetch pending invitations for the user
    const invitations = await prisma.invitation.findMany({
      where: {
        inviteeEmail: user.email,
        status: 'Pending',
      },
    });

    console.log(`✅ Found ${invitations.length} invitations for user ${user.email}:`, invitations);
    
    return NextResponse.json(invitations);
  } catch (error) {
    console.error('❌ Error fetching invitations:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}
