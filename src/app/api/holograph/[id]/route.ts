// /src/app/api/holograph/[id]/route.ts - Secure Holograph Detail API
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify that the user is either a Principal or a Delegate
    const holograph = await prisma.holograph.findUnique({
      where: { id: params.id },
      include: {
        principals: { select: { userId: true } },
        delegates: { select: { userId: true } },
      },
    });

    if (!holograph) {
      return NextResponse.json({ error: 'Holograph not found' }, { status: 404 });
    }

    // Check if the user is authorized
    const isAuthorized = holograph.principals.some(p => p.userId === userId) ||
                         holograph.delegates.some(d => d.userId === userId);
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    return NextResponse.json(holograph);
  } catch (error) {
    console.error('Error fetching Holograph:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
