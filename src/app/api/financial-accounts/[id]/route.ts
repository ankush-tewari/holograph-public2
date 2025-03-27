// /src/app/api/financial-accounts/[id]/route.ts 
// - PUT and DELETE methods

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadFileToGCS, uploadBufferToGCS, deleteFileFromGCS } from "@/lib/gcs";
import { debugLog } from "@/utils/debug";
import { encryptFieldWithHybridEncryption } from "@/utils/encryption";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const holographId = formData.get("holographId") as string;
    const name = formData.get("name") as string;
    const institution = formData.get("institution") as string;
    const accountType = formData.get("accountType") as string;
    const notes = formData.get("notes") as string;
    const uploadedBy = session.user.id;
    const existingFilePath = formData.get("existingFilePath") as string | null;
    const file = formData.get("file") as File | null;

    if (!name || !accountType || !holographId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Encrypt fields
    const encryptedName = await encryptFieldWithHybridEncryption(holographId, name);
    const encryptedInstitution = institution
      ? await encryptFieldWithHybridEncryption(holographId, institution)
      : null;
    const encryptedNotes = notes
      ? await encryptFieldWithHybridEncryption(holographId, notes)
      : null;

    let filePath = existingFilePath || null;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = file.name.split(".").pop();
      const gcsPath = `financial-accounts/${holographId}/${Date.now()}.${ext}`;

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

    const updatedAccount = await prisma.financialAccount.update({
      where: { id: params.id },
      data: {
        holographId,
        uploadedBy,
        accountType,
        filePath: filePath || undefined,

        name: encryptedName.encryptedValue,
        nameKey: encryptedName.encryptedKey,
        nameIV: encryptedName.iv,

        institution: encryptedInstitution?.encryptedValue || null,
        institutionKey: encryptedInstitution?.encryptedKey || null,
        institutionIV: encryptedInstitution?.iv || null,

        notes: encryptedNotes?.encryptedValue || null,
        notesKey: encryptedNotes?.encryptedKey || null,
        notesIV: encryptedNotes?.iv || null,
      },
    });

    debugLog("✅ Financial account updated:", updatedAccount.id);
    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error("❌ Error updating financial account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const record = await prisma.financialAccount.findUnique({ where: { id: params.id } });

    if (!record) {
      return NextResponse.json({ error: "Financial account not found" }, { status: 404 });
    }

    if (record.filePath) {
      await deleteFileFromGCS(record.filePath);
      debugLog(`🗑️ Deleted file from GCS: ${record.filePath}`);
    }

    await prisma.financialAccount.delete({ where: { id: params.id } });

    debugLog(`🗑️ Deleted financial account ${params.id} from database`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting financial account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}