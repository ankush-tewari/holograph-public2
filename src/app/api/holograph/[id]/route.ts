// src/app/api/holograph/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { debugLog } from "../../../../utils/debug";
import { deleteFileFromGCS } from "@/lib/gcs"; // Import Google Cloud Storage delete function

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error("❌ No authenticated session found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Keep existing URL params logic for backward compatibility
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');
    
    // Log both session user and query user if different
    if (queryUserId && queryUserId !== userId) {
      debugLog(`⚠️ Note: Query userId (${queryUserId}) differs from session userId (${userId}). Using session userId.`);
    }

    // ✅ Await params before using it
    const { id: holographId } = await context.params; 

    debugLog(`🔍 Fetching Holograph ${holographId} for user ${userId}`);

    // ✅ Fetch Holograph with Principals & Delegates
    const holograph = await prisma.holograph.findUnique({
      where: { id: holographId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        principals: { 
          select: { user: { select: { id: true, name: true } } } 
        },
        delegates: { 
          select: { user: { select: { id: true, name: true } } } 
        },
      },
    });

    if (!holograph) {
      console.error(`❌ Holograph ${holographId} not found`);
      return NextResponse.json({ error: "Holograph not found" }, { status: 404 });
    }

    debugLog(`✅ Found Holograph: ${holograph.title}`);

    // ✅ Fetch the first Principal as the "owner"
    const ownerId = holograph.principals.length > 0 ? holograph.principals[0].userId : null;
    const owner = ownerId
      ? await prisma.user.findUnique({
          where: { id: ownerId },
          select: { id: true, name: true },
        })
      : null;

    debugLog(`👤 Owner Found: ${owner?.name || "Unknown User"}`);

    // ✅ Check if the user is authorized
    const isAuthorized =
    holograph.principals.some(p => p.user.id === userId) ||
    holograph.delegates.some(d => d.user.id === userId);

    if (isAuthorized) {
      debugLog(`✅ User ${userId} is authorized to view full Holograph ${holographId}`);
      return NextResponse.json({
        id: holograph.id,
        title: holograph.title,
        createdAt: holograph.createdAt.toISOString(),
        updatedAt: holograph.updatedAt.toISOString(),
        principals: holograph.principals.map(p => ({ id: p.user.id, name: p.user.name })),
        delegates: holograph.delegates.map(d => ({ id: d.user.id, name: d.user.name })),
      });
    }

    // 🚨 If user is not a Principal or Delegate, check for an invitation
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.error(`❌ User ${userId} not found in database`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    debugLog(`🔍 Checking invitation for ${user.email} to Holograph ${holographId}`);

    const invitation = await prisma.invitation.findFirst({
      where: {
        holographId: holographId,
        inviteeEmail: user.email,
        status: "Pending",
      },
    });

    if (invitation) {
      debugLog(`🔹 User ${userId} has an invitation to Holograph ${holographId}. Returning limited data.`);
      return NextResponse.json({
        id: holograph.id,
        title: holograph.title, // Only return the title if invited
        owner: owner ? { id: owner.id, name: owner.name || "Unknown User" } : null,
      });
    }

    console.error(`❌ Unauthorized access: User ${userId} is not a Principal, Delegate, or Invitee`);
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });

  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// for editing a Holograph Name
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const updatedHolograph = await prisma.holograph.update({
      where: { id },
      data: { title },
    });

    return NextResponse.json(updatedHolograph, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update Holograph" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    debugLog(`🔍 Deleting Holograph with ID: ${id}`);

    // Fetch all related documents before deleting the Holograph
    const relatedDocuments = await prisma.vitalDocument.findMany({
      where: { holographId: id },
    });

    // Delete related documents from Google Cloud Storage
    for (const doc of relatedDocuments) {
      debugLog(`🗑 Deleting file from GCS: ${doc.filePath}`);
      await deleteFileFromGCS(doc.filePath);
    }

    // Delete all related database records
    debugLog("🗑 Deleting related vital documents...");
    await prisma.vitalDocument.deleteMany({ where: { holographId: id } });

    // Delete related records
    debugLog("🗑 Deleting related Principal and Delegate records...");
    await prisma.holographDelegate.deleteMany({ where: { holographId: id } });
    await prisma.holographPrincipal.deleteMany({ where: { holographId: id } });
    await prisma.invitation.deleteMany({ where: { holographId: id } });

    debugLog("🗑 Deleting the Holograph record...");
    await prisma.holograph.delete({ where: { id } });

    debugLog("✅ Holograph deleted successfully.");

    return NextResponse.json({ message: "Holograph deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting Holograph:", error);
    return NextResponse.json({ error: "Failed to delete Holograph" }, { status: 500 });
  }
}