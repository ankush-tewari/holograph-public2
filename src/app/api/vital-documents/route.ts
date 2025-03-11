// /src/app/api/vital-documents/route.ts GET and POST Methods

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadFileToGCS, deleteFileFromGCS } from "@/lib/gcs";
import formidable from "formidable";
import { Duplex } from "stream";
import { debugLog } from "../../../utils/debug";
import { Storage } from "@google-cloud/storage";
import crypto from "crypto";

// Disable Next.js's default body parsing so formidable can handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

const storage = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "holograph-user-documents";

// ✅ Function to Encrypt Data Using Public Key
async function encryptData(holographId, data) {
  const certPath = `ssl/${holographId}.crt`;
  debugLog("🔐 Attempting to encrypt data for holographId:", holographId);
  debugLog("🔐 Certificate path:", certPath);

  try {
    // Check if certificate exists first
    const [exists] = await storage.bucket(BUCKET_NAME).file(certPath).exists();
    if (!exists) {
      debugLog("❌ Certificate not found at path:", certPath);
      throw new Error(`Certificate not found for holograph ${holographId}`);
    }

    // Download the public key from GCS
    const [certFile] = await storage.bucket(BUCKET_NAME).file(certPath).download();
    debugLog("✅ Certificate downloaded successfully");
    const publicKey = certFile.toString();

    // Encrypt data using the public key
    const encryptedBuffer = crypto.publicEncrypt(publicKey, Buffer.from(data));
    debugLog("✅ Data encrypted successfully");
    return encryptedBuffer.toString("base64"); // Convert to base64 for database storage
  } catch (error) {
    debugLog(`❌ Error encrypting data for Holograph ${holographId}:`, error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

// ✅ Function to Decrypt Data Using Private Key
async function decryptData(holographId, encryptedData) {
  const keyPath = `ssl/${holographId}.key`;

  try {
    // Check if key exists first
    const [exists] = await storage.bucket(BUCKET_NAME).file(keyPath).exists();
    if (!exists) {
      debugLog("❌ Private key not found at path:", keyPath);
      return null;
    }

    // Download the private key from GCS
    const [keyFile] = await storage.bucket(BUCKET_NAME).file(keyPath).download();
    const privateKey = keyFile.toString();

    // Decrypt data using the private key
    const decryptedBuffer = crypto.privateDecrypt(privateKey, Buffer.from(encryptedData, "base64"));
    return decryptedBuffer.toString();
  } catch (error) {
    debugLog(`❌ Error decrypting data for Holograph ${holographId}:`, error);
    return null; // Return null if decryption fails
  }
}

// ✅ Handle GET Requests for Fetching Vital Documents
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const holographId = searchParams.get("holographId");

    debugLog("🟢 GET request for holographId:", holographId);

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

    debugLog("✅ Retrieved documents:", documents);
    // ✅ Decrypt each document before returning
    const decryptedDocuments = await Promise.all(
      documents.map(async (doc) => {
        const decryptedName = await decryptData(doc.holographId, doc.name);
        const decryptedNotes = doc.notes ? await decryptData(doc.holographId, doc.notes) : null;

        return {
          ...doc,
          name: decryptedName || "🔒 Unable to decrypt",
          notes: decryptedNotes || "🔒 Unable to decrypt",
        };
      })
    );
    debugLog("✅ Decrypted documents:", decryptedDocuments);
    return NextResponse.json(decryptedDocuments, { status: 200 });

  } catch (error) {
    console.error("❌ Error retrieving documents:", error.message || "Unknown error");
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

// ✅ Handle POST Requests for Uploading & Updating Vital Documents
export async function POST(req: Request) {
  // Define variables at the top level of the function scope
  let holographId = null;
  let name = null;
  let type = null;
  let notes = null;
  let uploadedBy = null;
  let filePath = null;
  let newFilePath = null;
  let encryptedName = null;
  let encryptedNotes = null;
  let isNewDocument = false;

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

    debugLog("🟢 Converted Request to Node stream for formidable");

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

    debugLog("🟢 Formidable Parsed Fields:", fields);
    debugLog("🟢 Formidable Parsed Files:", files);

    // Helper function to extract values
    const getSingleValue = (value: string | string[] | undefined): string | undefined => {
      if (Array.isArray(value)) return value[0];
      return value;
    };

    holographId = getSingleValue(fields.holographId);
    name = getSingleValue(fields.name);
    type = getSingleValue(fields.type);
    notes = getSingleValue(fields.notes);
    uploadedBy = getSingleValue(fields.uploadedBy);
    let existingFilePath = getSingleValue(fields.existingFilePath); // ✅ Existing file path if provided
    const fileField = files.file;

    debugLog("🟢 Parsed Fields:", { holographId, name, type, notes, uploadedBy });

    if (!holographId || !name || !type || !uploadedBy) {
      console.error("❌ Missing required fields:", { holographId, name, type, uploadedBy });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    filePath = existingFilePath;

    if (!fileField && !filePath) {
      console.error("❌ No new file uploaded and no existing file provided.");
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // ✅ Check if SSL certificate exists for this holograph
    debugLog("🔍 Checking if SSL certificate exists for holograph:", holographId);
    const certPath = `ssl/${holographId}.crt`;
    const [certExists] = await storage.bucket(BUCKET_NAME).file(certPath).exists();
    
    if (!certExists) {
      debugLog("❌ SSL certificate not found for holograph:", holographId);
      return NextResponse.json(
        { error: "Encryption certificate not found. Please set up encryption for this holograph first." },
        { status: 400 }
      );
    }
    
    debugLog("✅ SSL certificate found for holograph:", holographId);

    if (!filePath) {
      // ✅ Check for update vs new document
      debugLog("🔍 Checking document creation type...");
      
      // Check if this is an update (existingFilePath provided) or a new document
      if (existingFilePath) {
        // User is updating an existing document, regardless of whether a new file is uploaded
        debugLog("✏️ Updating existing document with path:", existingFilePath);
        isNewDocument = false;
        filePath = existingFilePath;
      } else if (fileField) {
        // No existing path but a new file - this is a new document
        debugLog("🆕 New file uploaded without existingFilePath, creating a new document.");
        isNewDocument = true;
      } else {
        // No file and no existing path - this is an error
        debugLog("❌ No file uploaded and no existing file path provided.");
        return NextResponse.json({ error: "Either a file or an existing file path must be provided" }, { status: 400 });
      }
    }

    newFilePath = filePath;

    if (fileField) {
      const file = Array.isArray(fileField) ? fileField[0] : fileField;
      debugLog("🟢 Using new file:", file);
      const gcsFileName = `uploads/${Date.now()}-${file.originalFilename}`;
      debugLog("🟢 GCS File Name:", gcsFileName);
      const uploadedFilePath = await uploadFileToGCS(file, gcsFileName);
      debugLog("🟢 File uploaded to GCS. Stored Path:", uploadedFilePath);
      
      const normalizedExistingFilePath = filePath
        ? filePath.replace("https://storage.googleapis.com/holograph-user-documents/", "")
        : null;

      const normalizedNewFilePath = uploadedFilePath
        ? uploadedFilePath.replace("https://storage.googleapis.com/holograph-user-documents/", "")
        : null;

      // ✅ Delete the old file from GCS if a new file was uploaded and this is an update
      if (!isNewDocument && normalizedExistingFilePath && normalizedExistingFilePath !== normalizedNewFilePath) {
        debugLog("🗑️ Deleting old file from GCS:", normalizedExistingFilePath);
        try {
          await deleteFileFromGCS(normalizedExistingFilePath);
          debugLog("✅ Old file deleted successfully.");
        } catch (error) {
          console.error("❌ Error deleting old file from GCS:", error.message || "Unknown error");
        }
      }
      newFilePath = uploadedFilePath; // ✅ Ensure new file path is saved
    } else {
      debugLog("✅ No new file uploaded, keeping existing file:", filePath);
    }

    if (!newFilePath) {
      console.error("❌ No valid file path available.");
      return NextResponse.json({ error: "File path missing" }, { status: 400 });
    }

    // ✅ Normalize file path - making sure we only store the relative path in the database
    const normalizedFilePath = newFilePath.replace("https://storage.googleapis.com/holograph-user-documents/", "");
    debugLog("📁 Normalized file path for storage:", normalizedFilePath);

    // ✅ Encrypt name and notes
    debugLog("🔐 Encrypting document name and notes...");
    try {
      // Encrypt name (required)
      encryptedName = await encryptData(holographId, name);
      debugLog("✅ Name encrypted successfully");
      
      // Encrypt notes (optional)
      if (notes) {
        encryptedNotes = await encryptData(holographId, notes);
        debugLog("✅ Notes encrypted successfully");
      }
    } catch (encryptionError) {
      debugLog("❌ Encryption failed:", encryptionError.message || "Unknown error");
      return NextResponse.json({ error: `Encryption failed: ${encryptionError.message || "Unknown error"}` }, { status: 500 });
    }

    if (isNewDocument) {
      // ✅ Create a new document
      debugLog("🆕 Creating a new document...");
      
      try {
        const newDocument = await prisma.vitalDocument.create({
          data: {
            holographId,
            name: encryptedName,
            type,
            notes: encryptedNotes || null,
            filePath: normalizedFilePath,
            uploadedBy,
          },
        });

        debugLog("✅ New document created with ID:", newDocument.id);
        return NextResponse.json(newDocument, { status: 201 });
      } catch (dbError) {
        debugLog("❌ Error creating document in database:", dbError.message || "Unknown error");
        return NextResponse.json({ error: `Database error: ${dbError.message || "Unknown error"}` }, { status: 500 });
      }
    } else {
      // ✅ Update an existing document
      debugLog("✏️ Updating existing document...");

      // Normalize existing file path for lookup
      const normalizedExistingFilePath = filePath.replace("https://storage.googleapis.com/holograph-user-documents/", "");
      debugLog("🔍 Looking up document with:", { holographId, filePath: normalizedExistingFilePath });

      try {
        const updatedDocument = await prisma.vitalDocument.update({
          where: {
            holographId_filePath: {
              holographId,
              filePath: normalizedExistingFilePath, // Use the original path for lookup
            },
          },
          data: {
            name: encryptedName,
            type,
            notes: encryptedNotes || null,
            // Only update the file path if a new file was uploaded
            ...(fileField ? { filePath: normalizedFilePath } : {}),
            uploadedBy,
          },
        });

        debugLog("✅ Document successfully updated:", updatedDocument.id);
        return NextResponse.json(updatedDocument, { status: 200 });
      } catch (dbError) {
        debugLog("❌ Error updating document in database:", dbError.message || "Unknown error");
        return NextResponse.json({ error: `Database error: ${dbError.message || "Unknown error"}` }, { status: 500 });
      }
    }

  } catch (error) {
    // Safe error logging
    const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : 'Unknown error';
    console.error("❌ Error processing document update:", errorMessage);
    
    // Debug logging
    debugLog("🔍 Debugging variables:");
    debugLog("📌 holographId:", holographId);
    debugLog("📌 encryptedName:", encryptedName ? "Set" : "Not set");
    debugLog("📌 encryptedNotes:", encryptedNotes ? "Set" : "Not set");
    debugLog("📌 filePath:", filePath);
    debugLog("📌 newFilePath:", newFilePath);
    debugLog("📌 isNewDocument:", isNewDocument);
    
    return NextResponse.json({ error: `Failed to update document: ${errorMessage}` }, { status: 500 });
  }
}