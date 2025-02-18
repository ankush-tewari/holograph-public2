// app/api/holograph/create/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';  // Updated import to use the existing db.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, content } = await request.json();

    // Validate input
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create holograph and principal relationship in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the holograph
      const holograph = await tx.holograph.create({
        data: {
          title,
          content,
        },
      });

      // Create the principal relationship
      await tx.holographPrincipal.create({
        data: {
          userId: session.user.id,
          holographId: holograph.id,
        },
      });

      return holograph;
    });

    return NextResponse.json({
      id: result.id,
      title: result.title,
      lastModified: result.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating holograph:', error);
    return NextResponse.json(
      { error: 'Failed to create holograph' },
      { status: 500 }
    );
  }
}