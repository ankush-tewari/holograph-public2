// /src/app/api/holograph/delegates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 API Route: Getting holographs where user is a delegate");
    
    // Get authenticated user from session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      console.log("❌ No authenticated user found in session");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log("✅ User ID from session:", userId);

    const delegatedHolographs = await prisma.holograph.findMany({
      where: {
        delegates: {
          some: { userId: userId } // Finds holographs where user is a delegate
        }
      },
      include: {
        principals: { select: { userId: true } }, // Fetching principals
      }
    });

    // Transform response to include the owner's userId
    const formattedHolographs = await Promise.all(
      delegatedHolographs.map(async (holograph) => {
        const ownerId = holograph.principals.length > 0 ? holograph.principals[0].userId : null;

        const owner = ownerId
          ? await prisma.user.findUnique({
              where: { id: ownerId },
              select: { id: true, name: true },
            })
          : null;

        return {
          id: holograph.id,
          title: holograph.title,
          lastModified: holograph.updatedAt.toISOString(),
          owner: owner ? { id: owner.id, name: owner.name ?? "Unknown User" } : null,
        };
      })
    );

    console.log("✅ Returning", formattedHolographs.length, "delegated holographs");
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

    // Remove delegate
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