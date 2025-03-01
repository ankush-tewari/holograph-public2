// /src/pages/api/vital-documents/upload.ts 

import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { prisma } from '@/lib/db';
import { uploadFileToGCS } from '@/lib/gcs';
import { debugLog } from "../../../utils/debug";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Ensure correct path


export const config = {
  api: { bodyParser: false }, // ✅ Required for handling file uploads
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  debugLog("➡️ Incoming request to upload a file:", req.method);

  if (req.method !== "POST") {
    console.error("❌ Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 🔹 Authenticate User (NEW)
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    console.error("❌ Unauthorized: No valid session");
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Formidable error:", err);
      return res.status(500).json({ error: "File upload failed" });
    }

    debugLog("🟢 Parsed form fields:", fields);
    debugLog("🟢 Parsed files:", files);

    const { holographId, name, type, notes } = fields;
    const file = files.file?.[0];

    if (!file || !holographId || !name || !type) {
      console.error("❌ Missing required fields:", { holographId, name, type, file });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔹 Ensure user has access to the Holograph (NEW)
    const userId = session.user.id;
    const holograph = await prisma.holograph.findFirst({
      where: {
        id: Array.isArray(holographId) ? holographId[0] : holographId,
        OR: [
          { principals: { some: { userId } } }, // User is a principal
          { delegates: { some: { userId } } },  // User is a delegate
        ],
      },
    });

    if (!holograph) {
      console.error("❌ Forbidden: User does not have access to this Holograph");
      return res.status(403).json({ error: "Forbidden: No access to this Holograph" });
    }

    try {
      debugLog("🔄 Uploading file to Google Cloud Storage...");

      const section = searchParams.get("section") || "vital-documents"; // Default to 'vital-documents' if not provided
      const gcsFileName = `${holographId}/${section}/${Date.now()}-${file.originalFilename}`;
      const fileUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsFileName}`;

      debugLog("✅ File uploaded successfully:", gcsFileName);

      debugLog("🔄 Saving file details in database...");
      const newDocument = await prisma.vitalDocument.create({
        data: {
          holographId: Array.isArray(holographId) ? holographId[0] : holographId,
          name: Array.isArray(name) ? name[0] : name,
          type: Array.isArray(type) ? type[0] : type,
          filePath: gcsFileName,
          uploadedBy: userId, // 🔹 Use session user ID
          notes: notes ? (Array.isArray(notes) ? notes[0] : notes) : null,
        },
      });

      debugLog("✅ File metadata saved:", newDocument);
      return res.status(201).json(newDocument);
    } catch (error) {
      console.error("❌ Upload processing error:", error);
      return res.status(500).json({ error: "Failed to upload file" });
    }
  });
}