// /src/app/api/holograph/[id]/route.ts

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { debugLog } from "@/utils/debug";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {

  const holographId = params.id;

  // ✅ 1. Authenticate user
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // ✅ 2. Verify user access to this Holograph
  const holograph = await prisma.holograph.findUnique({
    where: { id: holographId },
    select: {
      principals: { select: { userId: true } },
      delegates: { select: { userId: true } },
    },
  });
  
  if (!holograph) {
    return NextResponse.json({ error: "Holograph not found" }, { status: 404 });
  }
  
  const isAuthorizedPrincipal = holograph.principals.some(p => p.userId === userId);
  const isAuthorizedDelegate = holograph.delegates.some(d => d.userId === userId);
  
  if (!isAuthorizedPrincipal && !isAuthorizedDelegate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  

  console.log("📢 API called with holographId:", params.id);

  if (!params.id) {
    console.log("❌ Missing holograph ID");
    return NextResponse.json({ error: "Holograph ID is required" }, { status: 400 });
  }
  

  try {

    debugLog("🔍 Fetching sections linked to Holograph ID:", params.id)

    // ✅ 3. Fetch and return sections (only if authorized)
    const holographSections = await prisma.holographSection.findMany({
      where: { holographId: params.id },
      include: { section: true },
    });

    if (!holographSections.length) {
      console.log("❌ No sections found for Holograph ID:", params.id);
      return NextResponse.json({ error: "No sections found for this Holograph" }, { status: 404 });
    }

    //debugLog("✅ Sections found:", holographSections);

    return NextResponse.json(holographSections.map(s => ({
      sectionId: s.id, // ✅ Added sectionId (Primary key in HolographSection)
      id: s.section.id,
      name: s.section.name,
      slug: s.section.slug,
      description: s.section.description,
      iconSlug: s.section.iconSlug,
    })));
  } catch (error) {
    console.error("❌ Server Error fetching sections:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
