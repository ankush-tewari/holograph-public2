// /src/app/api/users/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // Ensure this path matches your Prisma client setup
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { debugLog } from "../../../../utils/debug";

export async function GET(request: Request, { params }: { params: { id: string } }) {

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requesterId = session.user.id;
  
  try {
    if (!params.id) {
      console.error("❌ User ID is missing in the request");
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    debugLog(`🔍 Fetching user details for ID: ${params.id}`);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.error(`❌ User ${params.id} not found`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
