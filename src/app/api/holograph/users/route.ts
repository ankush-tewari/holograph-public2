// /src/app/api/holograph/users/route.ts

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const holographId = searchParams.get("holographId");

  if (!holographId) {
    return NextResponse.json({ error: "Missing holographId" }, { status: 400 });
  }

  try {
    // Fetch all Principals of the Holograph
    const principals = await prisma.holographPrincipal.findMany({
      where: { holographId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Fetch all Delegates of the Holograph
    const delegates = await prisma.holographDelegate.findMany({
      where: { holographId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Format the response
    const formattedUsers = [
      ...principals.map((entry) => ({
        id: entry.user.id,
        name: entry.user.name || "Unknown",
        email: entry.user.email,
        role: "Principal",
      })),
      ...delegates.map((entry) => ({
        id: entry.user.id,
        name: entry.user.name || "Unknown",
        email: entry.user.email,
        role: "Delegate",
      })),
    ];

    return NextResponse.json(formattedUsers); // ✅ Always return an array
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
