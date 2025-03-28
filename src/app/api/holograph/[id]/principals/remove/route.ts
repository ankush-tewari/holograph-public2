// /src/app/api/holograph/[id]/principals/remove/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { debugLog } from '@/utils/debug';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const holographId = params.id;
  const requestedById = session.user.id;
  const { targetUserId } = await req.json();

  if (!holographId || !targetUserId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Verify requester is a Principal
    const isPrincipal = await prisma.holographPrincipal.findUnique({
      where: {
        holographId_userId: {
          holographId,
          userId: requestedById,
        },
      },
    });

    if (!isPrincipal) {
      return NextResponse.json({ error: 'Only Principals can initiate removal' }, { status: 403 });
    }

    // Fetch Holograph to get Owner
    const holograph = await prisma.holograph.findUnique({
      where: { id: holographId },
      select: { ownerId: true },
    });

    if (!holograph) {
      return NextResponse.json({ error: 'Holograph not found' }, { status: 404 });
    }

    if (targetUserId === holograph.ownerId) {
      return NextResponse.json({ error: 'Cannot remove the Holograph Owner' }, { status: 403 });
    }

    // Verify target is a Principal
    const isTargetPrincipal = await prisma.holographPrincipal.findUnique({
      where: {
        holographId_userId: {
          holographId,
          userId: targetUserId,
        },
      },
    });

    if (!isTargetPrincipal) {
      return NextResponse.json({ error: 'Target user is not a Principal' }, { status: 400 });
    }

    // Check for existing pending request
    const existingRequest = await prisma.pendingPrincipalRemoval.findUnique({
      where: {
        holographId_targetUserId: {
          holographId,
          targetUserId,
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'A pending removal already exists for this user' }, { status: 400 });
    }

    // Create PendingPrincipalRemoval
    const removalRequest = await prisma.pendingPrincipalRemoval.create({
      data: {
        holographId,
        targetUserId,
        requestedById,
      },
    });

    return NextResponse.json({ message: 'Removal request created', removalRequest }, { status: 200 });
  } catch (error) {
    console.error('Error creating removal request:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
