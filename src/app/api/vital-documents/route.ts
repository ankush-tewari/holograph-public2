// /src/app/api/vital-documents/route.ts GET and POST Methods

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadFileToGCS, deleteFileFromGCS } from "@/lib/gcs";
import formidable from "formidable";
import { Duplex } from "stream";

// Disable Next.js's default body parsing so formidable can handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ Handle GET Requests for Fetching Vital Documents
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const holographId = searchParams.get("holographId");

    console.log("🟢 GET request for holographId:", holographId);

    if (!holographId) {
      console.error("❌ Missing holographId in GET request");
      return NextResponse.json({ error: "Missing holographId" }, { status: 400 });
    }

    const documents = await prisma.vitalDocument.findMany({
      where: { holographId },
      orderBy: {
        createdAt: "asc", // ✅ Sorts in ascending order (oldest first)
      },
    });

    console.log("✅ Retrieved documents:", documents);
    return NextResponse.json(documents, { status: 200 });

  } catch (error) {
    console.error("❌ Error retrieving documents:", error);
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

// ✅ Handle POST Requests for Uploading & Updating Vital Documents
export async function POST(req: Request) {
  try {
    if (req.method !== "POST") {
      console.error("❌ Method Not Allowed");
      return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
    }

    // Convert the Next.js Request into a Node.js stream
    const bodyBuffer = Buffer.from(await req.arrayBuffer());
    const { Duplex } = await import("stream");
    const nodeReq = new Duplex() as any;
    nodeReq.push(bodyBuffer);
    nodeReq.push(null);
    nodeReq.headers = Object.fromEntries(req.headers.entries());

    console.log("🟢 Converted Request to Node stream for formidable");

    // Parse the incoming form data
    const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
      (resolve, reject) => {
        const form = formidable({ uploadDir: "./tmp", keepExtensions: true });
        form.parse(nodeReq, (err, fields, files) => {
          if (err) {
            console.error("❌ Error parsing form:", err);
            reject(err);
          } else {
            resolve({ fields, files });
          }
        });
      }
    );

    console.log("🟢 Formidable Parsed Fields:", fields);
    console.log("🟢 Formidable Parsed Files:", files);

    // Helper function to extract values
    const getSingleValue = (value: string | string[] | undefined): string | undefined => {
      if (Array.isArray(value)) return value[0];
      return value;
    };

    const holographId = getSingleValue(fields.holographId);
    const name = getSingleValue(fields.name);
    const type = getSingleValue(fields.type);
    const notes = getSingleValue(fields.notes);
    const uploadedBy = getSingleValue(fields.uploadedBy);
    let existingFilePath = getSingleValue(fields.existingFilePath); // ✅ Existing file path if provided
    const fileField = files.file;

    if (!holographId || !name || !type || !uploadedBy) {
      console.error("❌ Missing required fields:", { holographId, name, type, uploadedBy });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let filePath = existingFilePath;

    if (!fileField && !filePath) {
      console.error("❌ No new file uploaded and no existing file provided.");
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    let isNewDocument = false;

    if (!filePath) {
      // ✅ If no existing file path, check if this is a new document
      console.log("🔍 Checking if this is a new document...");
      const existingDocument = await prisma.vitalDocument.findFirst({
        where: { holographId, name },
        select: { filePath: true },
      });

      if (existingDocument) {
        console.log("✅ Found existing document in DB:", existingDocument.filePath);
        filePath = existingDocument.filePath;
      } else {
        console.log("🆕 No existing document found. Creating new document.");
        isNewDocument = true;
      }
    }

    let newFilePath = filePath;

    if (fileField) {
      const file = Array.isArray(fileField) ? fileField[0] : fileField;
      console.log("🟢 Using new file:", file);
      const gcsFileName = `uploads/${Date.now()}-${file.originalFilename}`;
      console.log("🟢 GCS File Name:", gcsFileName);
      newFilePath = await uploadFileToGCS(file, gcsFileName);
      console.log("🟢 File uploaded to GCS. Stored Path:", newFilePath);

      // ✅ Delete the old file from GCS if a new file was uploaded and this is an update
      if (!isNewDocument && filePath && filePath !== newFilePath) {
        console.log("🗑️ Deleting old file from GCS:", filePath);
        await deleteFileFromGCS(filePath);
      }
    } else {
      console.log("✅ No new file uploaded, keeping existing file:", filePath);
    }

    if (!newFilePath) {
      console.error("❌ No valid file path available.");
      return NextResponse.json({ error: "File path missing" }, { status: 400 });
    }

    // ✅ Normalize file path
    const normalizedFilePath = newFilePath.replace("https://storage.googleapis.com/holograph-user-documents/", "");

    if (isNewDocument) {
      // ✅ Create a new document
      console.log("🆕 Creating a new document...");
      const newDocument = await prisma.vitalDocument.create({
        data: {
          holographId,
          name,
          type,
          notes: notes || null,
          filePath: normalizedFilePath,
          uploadedBy,
        },
      });

      console.log("✅ New document created:", newDocument);
      return NextResponse.json(newDocument, { status: 201 });
    } else {
      // ✅ Update an existing document
      console.log("✏️ Updating existing document...");
      const updatedDocument = await prisma.vitalDocument.update({
        where: {
          holographId_filePath: {
            holographId,
            filePath: filePath.replace("https://storage.googleapis.com/holograph-user-documents/", ""),
          },
        },
        data: {
          name,
          type,
          notes: notes || null,
          filePath: normalizedFilePath,
          uploadedBy,
        },
      });

      console.log("✅ Document successfully updated:", updatedDocument);
      return NextResponse.json(updatedDocument, { status: 200 });
    }

  } catch (error) {
    console.error("❌ Error processing document update:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}
