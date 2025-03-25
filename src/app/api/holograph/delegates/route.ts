// /src/app/api/holograph/delegates/route.ts - GET function

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '@/lib/db';
import { debugLog } from "../../../../utils/debug";

export async function GET(request: NextRequest) {
  try {
    debugLog("🔍 API Route: Getting holographs where user is a delegate");
    
    // Get authenticated user from session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      debugLog("❌ No authenticated user found in session");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    debugLog("✅ User ID from session:", userId);

    // ✅ Fetch Delegated Holographs with assigned date (`assignedAt`) and first Principal as owner
    const delegatedHolographs = await prisma.holographDelegate.findMany({
      where: { userId: userId },
      select: {
        assignedAt: true, // ✅ Show when this user was assigned as a delegate
        holograph: {
          select: {
            id: true,
            title: true,
            updatedAt: true,
            principals: {
              take: 1, // ✅ Fetch the first Principal as the owner
              select: { user: { select: { id: true, firstName: true, lastName: true } } },
            },
          },
        },
      },
    });


    // Transform response to include the owner's userId
    // ✅ Format the response correctly
    const formattedHolographs = delegatedHolographs.map(dh => ({
      id: dh.holograph.id,
      title: dh.holograph.title,
      assignedAt: dh.assignedAt.toISOString(), // ✅ Show the date the user was assigned as delegate
      owner: dh.holograph.principals.length > 0
        ? { id: dh.holograph.principals[0].user.id, 
            firstName: dh.holograph.principals[0].user.firstName, 
            lastName: dh.holograph.principals[0].user.lastName }
        : null,
    }));

    debugLog("✅ Returning", formattedHolographs.length, "delegated holographs");
    return NextResponse.json(formattedHolographs);
  } catch (error) {
    console.error('Error fetching delegated holographs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delegated holographs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const authenticatedUserId = session.user.id;
    
    const { holographId, delegateId } = await request.json();

    // Validate input
    if (!holographId || !delegateId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify that the authenticated user is a principal
    const isPrincipal = await prisma.holographPrincipal.findUnique({
      where: {
        holographId_userId: {
          holographId,
          userId: authenticatedUserId,
        },
      },
    });

    if (!isPrincipal) {
      return NextResponse.json(
        { error: 'Not authorized to add delegates' },
        { status: 403 }
      );
    }

    // Check if user is already a delegate
    const existingDelegate = await prisma.holographDelegate.findUnique({
      where: {
        holographId_userId: {
          holographId,
          userId: delegateId,
        },
      },
    });

    if (existingDelegate) {
      return NextResponse.json(
        { error: 'User is already a delegate' },
        { status: 400 }
      );
    }

    // Add new delegate
    const result = await prisma.holographDelegate.create({
      data: {
        holographId,
        userId: delegateId,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error adding delegate:', error);
    return NextResponse.json(
      { error: 'Failed to add delegate' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user from session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const authenticatedUserId = session.user.id;
    
    const { searchParams } = new URL(request.url);
    const holographId = searchParams.get('holographId');
    const delegateId = searchParams.get('delegateId');

    if (!holographId || !delegateId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify that the authenticated user is a principal
    const isPrincipal = await prisma.holographPrincipal.findUnique({
      where: {
        holographId_userId: {
          holographId,
          userId: authenticatedUserId,
        },
      },
    });

    if (!isPrincipal) {
      return NextResponse.json(
        { error: 'Not authorized to remove delegates' },
        { status: 403 }
      );
    }

    // ✅ Delete delegate's permissions
    await prisma.delegatePermissions.deleteMany({
      where: {
        holographId,
        delegateId,
      },
    });

    // ✅ Delete delegate's invitations for this holograph
    await prisma.invitation.deleteMany({
      where: {
        holographId,
        inviteeId: delegateId,
      },
    });


    // ✅ Remove delegate from HolographDelegate
    await prisma.holographDelegate.delete({
      where: {
        holographId_userId: {
          holographId,
          userId: delegateId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing delegate:', error);
    return NextResponse.json(
      { error: 'Failed to remove delegate' },
      { status: 500 }
    );
  }
}