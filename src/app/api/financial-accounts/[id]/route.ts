// /src/app/api/financial-accounts/[id]/route.ts 
// - PUT and DELETE methods

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadFileToGCS, uploadBufferToGCS, deleteFileFromGCS } from "@/lib/gcs";
import { debugLog } from "@/utils/debug";
import { encryptFieldWithHybridEncryption } from "@/utils/encryption";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { financialAccountSchema } from "@/validators/financialAccountSchema"; // ✅ Import schema
import { ZodError } from "zod"; // ✅ Zod error type
import { encryptBuffer } from "@/lib/encryption/crypto";
import { uploadEncryptedBufferToGCS } from "@/lib/gcs";

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
    const institution = formData.get("institution") as string;
    const accountType = formData.get("accountType") as string;
    const notes = formData.get("notes") as string;
    let uploadedBy: string | null = null; // ✅ Initialize as null
    const existingFilePath = formData.get("existingFilePath") as string | null;
    const file = formData.get("file") as File | null;
    updatedBy = session.user.id

    // ✅ Zod input validation
    try {
      financialAccountSchema.parse({
        name,
        institution,
        accountType,
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
    const encryptedInstitution = institution
      ? await encryptFieldWithHybridEncryption(holographId, institution)
      : null;
    const encryptedNotes = notes
      ? await encryptFieldWithHybridEncryption(holographId, notes)
      : null;

    let filePath = existingFilePath || null;

    if (file) {
      uploadedBy = session.user.id; // ✅ Only set uploadedBy if a file is present
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

      // Encrypt and upload
      const encryptedBuffer = await encryptBuffer(buffer, holographId);
      await uploadEncryptedBufferToGCS(encryptedBuffer, gcsPath, file.type || "application/octet-stream");
      filePath = gcsPath;
    }

    const updatedAccount = await prisma.financialAccount.update({
      where: { id: params.id },
      data: {
        holographId,
        uploadedBy,
        accountType,
        updatedBy,
        filePath: filePath || undefined,

        name: encryptedName.encryptedValue,
        nameKey: encryptedName.encryptedKey,
        nameIV: encryptedName.iv,

        institution: encryptedInstitution?.encryptedValue,
        institutionKey: encryptedInstitution?.encryptedKey,
        institutionIV: encryptedInstitution?.iv,

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
    const { searchParams } = new URL(req.url);
    const fileOnly = searchParams.get("fileOnly") === "true"; // Determine if file-only delete

    // Step 1 look up record + access rights
    const record = await prisma.financialAccount.findUnique({
      where: { id: params.id },
      select: { filePath: true, holographId: true },
    });

    if (!record) {
      return NextResponse.json({ error: "Financial account not found" }, { status: 404 });
    }

    // Ensure the user has permissions to modify this financial account
    const userAccess = await prisma.holographPrincipal.findFirst({
      where: {
        holographId: record.holographId,
        userId: session.user.id,
      },
    });

    if (!userAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 🟢 Step 2 File-only delete mode: Remove file but keep the record
    // 🟢 File-only delete mode: Remove file but keep the record
    if (fileOnly) {
      if (!record.filePath) {
        return NextResponse.json({ error: "No file to delete" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await deleteFileFromGCS(record.filePath!);
        debugLog(`🗑️ GCS file deleted: ${record.filePath}`);

        await tx.financialAccount.update({
          where: { id: params.id },
          data: {
            filePath: "", // Force recognition
          },
        });

        await tx.financialAccount.update({
          where: { id: params.id },
          data: {
            filePath: null,
            uploadedBy: null,
          },
        });
      });

    
      debugLog(`🗑️ Database updated: filePath=null, uploadedBy=null for Financial Account ${params.id}`);
      return NextResponse.json({ success: true, message: "File deleted, record updated" });
    }
    
    // Step 3: Full delete (file + DB record)
    await prisma.$transaction(async (tx) => {
      if (record.filePath) {
        await deleteFileFromGCS(record.filePath);
        debugLog(`🗑️ GCS file deleted: ${record.filePath}`);
      }

      await tx.financialAccount.delete({
        where: { id: params.id },
      });

      debugLog(`🗑️ Deleted financial account ${params.id} from database`);
    });
    return NextResponse.json({ success: true, message: "Financial account deleted" });

  } catch (error) {
    console.error("❌ Error deleting financial account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}