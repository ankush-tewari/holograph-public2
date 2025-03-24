// /src/app/api/holograph/[id]/transfer-ownership/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { debugLog } from "@/utils/debug";

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: holographId } = context.params;
  const { newOwnerId } = await req.json();

  if (!newOwnerId) {
    return NextResponse.json({ error: "Missing newOwnerId" }, { status: 400 });
  }

  try {
    // Fetch the Holograph and verify ownership
    const holograph = await prisma.holograph.findUnique({
      where: { id: holographId },
      select: { ownerId: true },
    });

    if (!holograph) {
      return NextResponse.json({ error: "Holograph not found" }, { status: 404 });
    }

    if (holograph.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only the current owner can transfer ownership." }, { status: 403 });
    }

    // Update ownerId in Holograph
    await prisma.holograph.update({
      where: { id: holographId },
      data: { ownerId: newOwnerId },
    });

    // Add to OwnershipAuditLog
    await prisma.ownershipAuditLog.create({
      data: {
        holographId,
        oldOwnerId: holograph.ownerId,
        currentOwnerId: newOwnerId,
      },
    });

    return NextResponse.json({ message: "Ownership transferred successfully." });
  } catch (error) {
    console.error("Error in transfer-ownership:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
