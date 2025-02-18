// /src/app/api/holograph/create/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { title, content, principalId } = await request.json();

    // Validate input
    if (!title || !content || !principalId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the holograph and set up principal relationship in a transaction
    const result = await db.$transaction(async (tx) => {
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
          holographId: holograph.id,
          userId: principalId,
        },
      });

      return holograph;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating holograph:', error);
    return NextResponse.json(
      { error: 'Failed to create holograph' },
      { status: 500 }
    );
  }
}