// /src/app/api/personal-properties/[id]/route.ts 
// - PUT and DELETE methods

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadBufferToGCS, deleteFileFromGCS } from "@/lib/gcs";
import { debugLog } from "@/utils/debug";
import { encryptFieldWithHybridEncryption } from "@/utils/encryption";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { personalPropertySchema } from "@/validators/personalPropertySchema";
import { ZodError } from "zod";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let updatedBy: string | null = null; 

  try {
    const formData = await req.formData();

    const holographId = formData.get("holographId") as string;
    const name = formData.get("name") as string;
    const notes = formData.get("notes") as string;
    let uploadedBy: string | null = null; // ✅ Initialize as null
    const existingFilePath = formData.get("existingFilePath") as string | null;
    const file = formData.get("file") as File | null;
    updatedBy = session.user.id

    try {
      personalPropertySchema.parse({
        name,
        notes,
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ errors: err.errors }, { status: 400 });
      }
      throw err;
    }


    if (!holographId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Encrypt fields
    const encryptedName = await encryptFieldWithHybridEncryption(holographId, name);
    const encryptedNotes = notes
      ? await encryptFieldWithHybridEncryption(holographId, notes)
      : null;

    let filePath = existingFilePath || null;

    if (file) {
      uploadedBy = session.user.id; // ✅ Only set uploadedBy if a file is present
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = file.name.split(".").pop();
      const gcsPath = `personal-properties/${holographId}/${Date.now()}.${ext}`;

      // If existing file path is different, delete the old one
      if (existingFilePath && existingFilePath !== gcsPath) {
        try {
          await deleteFileFromGCS(existingFilePath);
          debugLog(`🗑️ Deleted old file from GCS: ${existingFilePath}`);
        } catch (err) {
          console.error("❌ Failed to delete old file:", err);
        }
      }

      await uploadBufferToGCS(buffer, gcsPath, file.type);
      filePath = gcsPath;
    }

    const updatedAccount = await prisma.personalProperty.update({
      where: { id: params.id },
      data: {
        holographId,
        uploadedBy,
        updatedBy,
        filePath: filePath || undefined,

        name: encryptedName.encryptedValue,
        nameKey: encryptedName.encryptedKey,
        nameIV: encryptedName.iv,

        notes: encryptedNotes?.encryptedValue || null,
        notesKey: encryptedNotes?.encryptedKey || null,
        notesIV: encryptedNotes?.iv || null,
      },
    });

    debugLog("✅ Personal Property updated:", updatedAccount.id);
    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error("❌ Error updating property:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const fileOnly = searchParams.get("fileOnly") === "true"; // Determine if file-only delete

    const record = await prisma.personalProperty.findUnique({
      where: { id: params.id },
      select: { filePath: true, holographId: true },
    });

    if (!record) {
      return NextResponse.json({ error: "Personal Property not found" }, { status: 404 });
    }

    // Ensure the user has permissions to modify this property
    const userAccess = await prisma.holographPrincipal.findFirst({
      where: {
        holographId: record.holographId,
        userId: session.user.id,
      },
    });

    if (!userAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 🟢 File-only delete mode: Remove file but keep the record
    if (fileOnly) {
      if (record.filePath) {
        await deleteFileFromGCS(record.filePath);
        debugLog(`🗑️ Deleted file from GCS: ${record.filePath}`);

        // ✅ Force Prisma to recognize the update by explicitly setting filePath to an empty string before setting to null
        await prisma.personalProperty.update({
          where: { id: params.id },
          data: {
            filePath: "", // Temporary empty value to force recognition
          },
        });
        
        // ✅ Ensure filePath and uploadedBy are removed from the property record
        await prisma.personalProperty.update({
          where: { id: params.id },
          data: { filePath: null, uploadedBy: null },
        });

        debugLog(`🗑️ Database updated: filePath=null, uploadedBy=null for Personal Property ${params.id}`);

        return NextResponse.json({ success: true, message: "File deleted, record updated" });
      }
      return NextResponse.json({ error: "No file to delete" }, { status: 400 });
    }

    // 🟢 Default: Delete the entire personal property (existing behavior)
    if (record.filePath) {
      await deleteFileFromGCS(record.filePath);
      debugLog(`🗑️ Deleted file from GCS: ${record.filePath}`);
    }

    await prisma.property.delete({ where: { id: params.id } });

    debugLog(`🗑️ Deleted personal property ${params.id} from database`);
    return NextResponse.json({ success: true, message: "Personal Property deleted" });

  } catch (error) {
    console.error("❌ Error deleting personal property:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}