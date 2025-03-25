// src/app/api/holograph/[id]/route.ts
// GET, PUT and DELETE functions 

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

    // ✅ Fetch the Owner
    const holograph = await prisma.holograph.findUnique({
      where: { id: holographId },
      select: {
        id: true,
        title: true,
        geography: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,  
        owner: {
          select: { id: true, firstName: true, lastName: true },
        },
        principals: {
          select: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        delegates: {
          select: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!holograph) {
      console.error(`❌ Holograph ${holographId} not found`);
      return NextResponse.json({ error: "Holograph not found" }, { status: 404 });
    }

    debugLog(`✅ Found Holograph: ${holograph.title}`)
    debugLog(`👤 Owner Found: ${holograph.owner ? `${holograph.owner.firstName} ${holograph.owner.lastName}` : "Unknown User"}`);

    // ✅ Check if the user is authorized (Principals and Delegates)
    const isPrincipal = holograph.principals.some(p => p.user.id === userId);
    const isDelegate = holograph.delegates.some(d => d.user.id === userId);

    if (isPrincipal || isDelegate) {
      debugLog(`✅ User ${userId} is authorized to view full Holograph ${holographId}`);
      return NextResponse.json({
        id: holograph.id,
        title: holograph.title,
        geography: holograph.geography,
        createdAt: holograph.createdAt.toISOString(),
        updatedAt: holograph.updatedAt.toISOString(),
        ownerId: holograph.ownerId,
        owner: holograph.owner
          ? {
              id: holograph.owner.id,
              firstName: holograph.owner.firstName,
              lastName: holograph.owner.lastName,
            }
          : null,
        principals: holograph.principals.map(p => ({
          id: p.user.id,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
        })),
        delegates: holograph.delegates.map(d => ({
          id: d.user.id,
          firstName: d.user.firstName,
          lastName: d.user.lastName,
        })),
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
        owner: holograph.owner
          ? {
              id: holograph.owner.id,
              name: `${holograph.owner.firstName} ${holograph.owner.lastName}`,
            }
          : { id: "unknown", name: "Unknown User" },
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

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { id } = params;
    // 🔐 Authorization: Only Principals can edit the Holograph
    const isPrincipal = await prisma.holographPrincipal.findFirst({
      where: { holographId: id, userId },
    });
    if (!isPrincipal) {
      return NextResponse.json({ error: 'Forbidden — only Principals can edit this Holograph' }, { status: 403 });
    }
    
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

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    const userId = session.user.id;

    debugLog(`🔍 User ${userId} attempting to delete Holograph with ID: ${id}`);

    // 🔐 Fetch Holograph Owner and cert paths
    const holograph = await prisma.holograph.findUnique({
      where: { id },
      select: { ownerId: true, sslCertPath: true, sslKeyPath: true },
    });

    if (!holograph) {
      return NextResponse.json({ error: "Holograph not found" }, { status: 404 });
    }

    // 🔐 Verify Owner
    if (holograph.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden — only the Owner can delete this Holograph' }, { status: 403 });
    }

    // ✅ Step 1: Delete related Sections from `HolographSection`
    debugLog("🗑 Deleting related sections in HolographSection...");
    await prisma.holographSection.deleteMany({ where: { holographId: id } });

    // ✅ Step 2: Delete SSL Certificates from Google Cloud Storage
    debugLog("🔍 Fetching SSL certificate paths for deletion...");

    if (holograph?.sslCertPath) {
      await deleteFileFromGCS(holograph.sslCertPath);
    }
    if (holograph?.sslKeyPath) {
      await deleteFileFromGCS(holograph.sslKeyPath);
    }

    // ✅ Step 3: Fetch all related documents before deleting the Holograph
    const relatedDocuments = await prisma.vitalDocument.findMany({
      where: { holographId: id },
    });


    // ✅ Step 4: Delete related documents from Google Cloud Storage
    for (const doc of relatedDocuments) {
      debugLog(`🗑 Deleting file from GCS: ${doc.filePath}`);
      await deleteFileFromGCS(doc.filePath);
    }

    // ✅ Step 5: Delete all related database records
    debugLog("🗑 Deleting related vital documents...");
    await prisma.vitalDocument.deleteMany({ where: { holographId: id } });

    // ✅ Step 6: Delete related Principals and Delegates
    debugLog("🗑 Deleting related Principal and Delegate records...");
    await prisma.holographDelegate.deleteMany({ where: { holographId: id } });
    await prisma.holographPrincipal.deleteMany({ where: { holographId: id } });
    await prisma.invitation.deleteMany({ where: { holographId: id } });

    // ✅ Step 7A: Delete OwnershipAuditLog entries
    debugLog("🗑 Deleting OwnershipAuditLog entries...");
    await prisma.ownershipAuditLog.deleteMany({ where: { holographId: id } });


    // ✅ Step 7: Finally delete the Holograph
    debugLog("🗑 Deleting the Holograph record...");
    await prisma.holograph.delete({ where: { id } });

    debugLog("✅ Holograph deleted successfully.");

    return NextResponse.json({ message: "Holograph deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting Holograph:", error);
    return NextResponse.json({ error: "Failed to delete Holograph" }, { status: 500 });
  }
}