// /src/app/api/holograph/principals/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';  // Updated import to use the existing db.ts

export async function POST(request: Request) {
  try {
    const { holographId, userId } = await request.json();

    // Validate input
    if (!holographId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is already a principal
    const existingPrincipal = await prisma.holographPrincipal.findUnique({
      where: {
        holographId_userId: {
          holographId,
          userId,
        },
      },
    });

    if (existingPrincipal) {
      return NextResponse.json(
        { error: 'User is already a principal' },
        { status: 400 }
      );
    }

    // Add new principal
    const result = await prisma.holographPrincipal.create({
      data: {
        holographId,
        userId,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error adding principal:', error);
    return NextResponse.json(
      { error: 'Failed to add principal' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const holographId = searchParams.get('holographId');
    const userId = searchParams.get('userId');

    if (!holographId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if this is the last principal
    const principalCount = await prisma.holographPrincipal.count({
      where: { holographId },
    });

    if (principalCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove last principal' },
        { status: 400 }
      );
    }

    // Remove principal
    await prisma.holographPrincipal.delete({
      where: {
        holographId_userId: {
          holographId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing principal:', error);
    return NextResponse.json(
      { error: 'Failed to remove principal' },
      { status: 500 }
    );
  }
}