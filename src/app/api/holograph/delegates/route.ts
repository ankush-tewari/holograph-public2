// /src/app/api/holograph/delegates/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    const isPrincipal = await db.holographPrincipal.findUnique({
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
    const existingDelegate = await db.holographDelegate.findUnique({
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
    const result = await db.holographDelegate.create({
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
    const isPrincipal = await db.holographPrincipal.findUnique({
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
    await db.holographDelegate.delete({
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