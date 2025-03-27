// /src/app/api/financial-accounts/route.ts 
// - GET and POST methods

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadFileToGCS, uploadBufferToGCS, deleteFileFromGCS } from "@/lib/gcs";
import { debugLog } from "@/utils/debug";
import { encryptFieldWithHybridEncryption } from "@/utils/encryption";
import { decryptFieldWithHybridEncryption } from "@/utils/encryption";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const holographId = searchParams.get("holographId");

  if (!holographId) {
    return NextResponse.json({ error: "Missing holographId" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    const isPrincipal = holograph.principals.some(p => p.userId === session.user.id);
    const isDelegate = holograph.delegates.some(d => d.userId === session.user.id);

    if (!isPrincipal && !isDelegate) {
      return NextResponse.json({ error: "Forbidden — no access to these financial accounts" }, { status: 403 });
    }

    const accounts = await prisma.financialAccount.findMany({
      where: { holographId },
      orderBy: { createdAt: "asc" },
    });

    const decryptedAccounts = await Promise.all(accounts.map(async (acc) => {
      const decryptedName = await decryptFieldWithHybridEncryption(
        acc.holographId,
        acc.name,
        acc.nameKey,
        acc.nameIV
      );

      const decryptedInstitution = acc.institution
        ? await decryptFieldWithHybridEncryption(
            acc.holographId,
            acc.institution,
            acc.institutionKey,
            acc.institutionIV
          )
        : null;

      const decryptedNotes = acc.notes
        ? await decryptFieldWithHybridEncryption(
            acc.holographId,
            acc.notes,
            acc.notesKey,
            acc.notesIV
          )
        : null;

      return {
        ...acc,
        name: decryptedName || "🔒 Unable to decrypt",
        institution: decryptedInstitution || null,
        notes: decryptedNotes || null,
      };
    }));

    debugLog("✅ Decrypted financial accounts:", decryptedAccounts);
    return NextResponse.json(decryptedAccounts, { status: 200 });
  } catch (error) {
    console.error("❌ Failed to fetch financial accounts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const BUCKET_NAME = process.env.GCS_BUCKET_NAME!;
  const GCS_PREFIX = `https://storage.googleapis.com/${BUCKET_NAME}/`;


  let holographId: string | null = null;
  let name: string | null = null;
  let institution: string | null = null;
  let accountType: string | null = null;
  let notes: string | null = null;
  let uploadedBy = userId;
  let filePath: string | null = null;
  let newFilePath: string | null = null;
  let isNewDocument = false;

  try {
    const formData = await req.formData();
    holographId = formData.get("holographId") as string;
    name = formData.get("name") as string;
    institution = formData.get("institution") as string;
    accountType = formData.get("accountType") as string;
    notes = formData.get("notes") as string;
    const existingFilePath = formData.get("existingFilePath") as string | null;
    const file = formData.get("file") as File | null;
    const financialAccountId = formData.get("id") as string | null; 
    const isNewDocument = !financialAccountId && !existingFilePath;


    let existingAccount = null;

    if (financialAccountId) {
      existingAccount = await prisma.financialAccount.findUnique({
        where: { id: financialAccountId }, // ✅ Lookup by ID first
      });
    } else if (!isNewDocument) {
      existingAccount = await prisma.financialAccount.findFirst({
        where: { holographId, filePath: existingFilePath || null }, // ✅ Fallback lookup by filePath
      });
    }

    // 🚨 If updating but no record exists, return an error
    if (!isNewDocument && !existingAccount) {
      debugLog("⚠️ No existing financial account found, preventing accidental duplication.");
      return NextResponse.json({ error: "Financial account record not found for update." }, { status: 404 });
    }


    debugLog("🟢 Parsed fields:", { holographId, name, institution, accountType, notes });

    if (!holographId || !name || !accountType || !uploadedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

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

    const isPrincipal = holograph.principals.some((p) => p.userId === userId);
    if (!isPrincipal) {
      return NextResponse.json({ error: "Forbidden — no access to this Holograph" }, { status: 403 });
    }

    filePath = existingFilePath;
    newFilePath = filePath;
    let relativeFilePath: string | null = null;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = file.name.split(".").pop();
    
      // ✅ Preserve original name and prepend timestamp
      const safeOriginalName = file.name.replaceAll("/", "_");
      const timestampedFileName = `${Date.now()}-${safeOriginalName}`;
    
      // ✅ New GCS structure: <holographId>/<section>/<timestamped-original-name>
      const section = "financial-accounts"; // <- change as needed per section
      const gcsFileName = `${holographId}/${section}/${timestampedFileName}`;
    
      debugLog("🟢 Uploading new file:", gcsFileName);
      const uploadedPath = await uploadBufferToGCS(buffer, gcsFileName, file.type);
    
      const normalizedExistingFilePath = filePath;
      const normalizedNewFilePath = uploadedPath;
    
      if (!isNewDocument && normalizedExistingFilePath && normalizedExistingFilePath !== normalizedNewFilePath) {
        debugLog("🗑️ Deleting old file from GCS:", normalizedExistingFilePath);
        try {
          await deleteFileFromGCS(normalizedExistingFilePath);
        } catch (err) {
          console.warn("⚠️ Error deleting old file:", err);
        }
      }
      newFilePath = uploadedPath;
      relativeFilePath = newFilePath ? newFilePath.replace(GCS_PREFIX, "") : null;

    } else {
      debugLog("✅ No new file uploaded, keeping existing:", filePath);
      relativeFilePath = filePath ? filePath.replace(GCS_PREFIX, "") : null; // ✅ Ensure relativeFilePath is properly handled
    }
    
    
    // 🔐 Encrypt fields
    const nameEncrypted = await encryptFieldWithHybridEncryption(holographId, name);
    const institutionEncrypted = institution
      ? await encryptFieldWithHybridEncryption(holographId, institution)
      : null;
    const notesEncrypted = notes
      ? await encryptFieldWithHybridEncryption(holographId, notes)
      : null;
      

    if (isNewDocument) {
      debugLog("🆕 Creating financial account...");

      const created = await prisma.financialAccount.create({
        data: {
          holographId,
          uploadedBy,
          accountType,
          filePath: relativeFilePath || null,


          name: nameEncrypted.encryptedValue,
          nameKey: nameEncrypted.encryptedKey,
          nameIV: nameEncrypted.iv,

          institution: institutionEncrypted?.encryptedValue || null,
          institutionKey: institutionEncrypted?.encryptedKey || null,
          institutionIV: institutionEncrypted?.iv || null,

          notes: notesEncrypted?.encryptedValue || null,
          notesKey: notesEncrypted?.encryptedKey || null,
          notesIV: notesEncrypted?.iv || null,
        },
      });

      debugLog("✅ Created:", created.id);
      return NextResponse.json(created, { status: 201 });
    } else {
      debugLog("✏️ Updating financial account...");
      

      const updated = await prisma.financialAccount.update({
        where: { id: financialAccountId || existingAccount?.id }, // ✅ Lookup by ID first
        data: {
          uploadedBy,
          accountType,
          filePath: relativeFilePath || null,

          name: nameEncrypted.encryptedValue,
          nameKey: nameEncrypted.encryptedKey,
          nameIV: nameEncrypted.iv,

          institution: institutionEncrypted?.encryptedValue || null,
          institutionKey: institutionEncrypted?.encryptedKey || null,
          institutionIV: institutionEncrypted?.iv || null,

          notes: notesEncrypted?.encryptedValue || null,
          notesKey: notesEncrypted?.encryptedKey || null,
          notesIV: notesEncrypted?.iv || null,
        },
      });

      debugLog("✅ Updated:", updated.id);
      return NextResponse.json(updated, { status: 200 });
    }
  } catch (error: any) {
    console.error("❌ Full error during financial account create/update:", error);
  
    const message =
      error?.response?.data?.error ||
      error?.response?.data ||
      error?.message ||
      "Unknown error";
  
    return NextResponse.json({ error: message }, { status: 500 });
  }  
}
