// /src/app/api/holograph/delegates/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';  // Updated import to use the existing db.ts

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

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
          owner: owner ? { id: owner.id, name: owner.name ?? "Unknown User 7" } : null, // ✅ Fix: Ensure object format
        };
      })
    );

    // ✅ Fetch the first principal as the owner
    const delegatedData = await Promise.all(
      delegatedHolographs.map(async (holo) => {
        const ownerId = holo.principals.length > 0 ? holo.principals[0].userId : null;

        const owner = ownerId
          ? await prisma.user.findUnique({
              where: { id: ownerId },
              select: { id: true, name: true },
            })
          : null;

        return {
          ...holo,
          owner: owner ? { id: owner.id, name: owner.name ?? "Unknown User" } : null, // ✅ Return as object
        };
      })
    );

    return NextResponse.json(formattedHolographs);
  } catch (error) {
    console.error('Error fetching delegated holographs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delegated holographs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { holographId, delegateId, principalId } = await request.json();

    // Validate input
    if (!holographId || !delegateId || !principalId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify that the requesting user is a principal
    const isPrincipal = await prisma.holographPrincipal.findUnique({
      where: {
        holographId_userId: {
          holographId,
          userId: principalId,
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const holographId = searchParams.get('holographId');
    const delegateId = searchParams.get('delegateId');
    const principalId = searchParams.get('principalId');

    if (!holographId || !delegateId || !principalId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify that the requesting user is a principal
    const isPrincipal = await prisma.holographPrincipal.findUnique({
      where: {
        holographId_userId: {
          holographId,
          userId: principalId,
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
