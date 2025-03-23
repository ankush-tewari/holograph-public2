// /src/app/api/holograph/principals/route.ts 

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '@/lib/db';
import { removePrincipal } from '@/utils/principalHelpers';
import { debugLog } from "../../../../utils/debug";

export async function GET(request: NextRequest) {
  try {
    debugLog("🔍 API Route: Getting holographs where user is a principal");
    
    // Get authenticated user from session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      debugLog("❌ No authenticated user found in session");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    debugLog("✅ User ID from session:", userId);

    // Fetch holographs where the user is a principal
    const ownedHolographs = await prisma.holograph.findMany({
      where: {
        principals: {
          some: { userId: userId }
        }
      }
    });

    debugLog("✅ Returning", ownedHolographs.length, "holographs");
    return NextResponse.json(ownedHolographs);
  } catch (error) {
    console.error('Error fetching owned holographs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owned holographs' },
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
    
    // Get request body
    const { holographId, userId } = await request.json();

    // Validate input
    if (!holographId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Security check: Either the user is adding themselves or the user is already a principal of this holograph
    if (authenticatedUserId !== userId) {
      // Check if authenticated user is a principal of the holograph
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
          { error: 'Unauthorized to add another user as principal' },
          { status: 403 }
        );
      }
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authenticatedUserId = session.user.id;
    const { searchParams } = new URL(request.url);
    const holographId = searchParams.get('holographId');
    const userIdToRemove = searchParams.get('userId');

    if (!holographId || !userIdToRemove) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await removePrincipal(holographId, userIdToRemove, authenticatedUserId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing principal:', error);
    return NextResponse.json({ error: 'Failed to remove principal' }, { status: 500 });
  }
}
