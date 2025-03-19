// /src/app/api/holograph/delegates/list/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const holographId = searchParams.get("holographId");

  if (!holographId) {
    return NextResponse.json({ error: "Missing holographId" }, { status: 400 });
  }

  try {
    const delegates = await prisma.holographDelegate.findMany({
      where: { holographId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },      
    });

    const formatted = delegates.map((d) => ({
      id: d.user.id,
      firstName: d.user.firstName || "Unknown First Name",
      lastName: d.user.lastName || "Unknown Last Name",
      email: d.user.email,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching delegates:", error);
    return NextResponse.json({ error: "Failed to fetch delegates" }, { status: 500 });
  }
}