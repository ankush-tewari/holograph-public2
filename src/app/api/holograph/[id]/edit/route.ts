// /src/app/api/holograph/[id]/edit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { debugLog } from "@/utils/debug";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const holographId = params.id;
  const { title, geography } = await req.json();

  debugLog("📌 Editing Holograph:", holographId);
  debugLog("📝 New Title:", title);
  debugLog("🌍 New Geography:", geography);

  try {
    const updated = await prisma.holograph.update({
      where: { id: holographId },
      data: {
        title,
        geography,
        updatedAt: new Date(),
        // future: updatedBy: session.user.id
      },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      geography: updated.geography,
      lastModified: updated.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Error updating Holograph:", error);
    return NextResponse.json(
      { error: "Failed to update Holograph" },
      { status: 500 }
    );
  }
}
