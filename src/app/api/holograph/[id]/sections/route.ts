// /src/app/api/holograph/[id]/route.ts

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { debugLog } from "../../../../../utils/debug";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  console.log("📢 API called with holographId:", params.id);

  if (!params.id) {
    console.log("❌ Missing holograph ID");
    return NextResponse.json({ error: "Holograph ID is required" }, { status: 400 });
  }
  const holographId = params.id;

  try {

    debugLog("🔍 Fetching sections linked to Holograph ID:", params.id)

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
