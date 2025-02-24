// /src/app/api/vital-documents/route.ts handles handle fetching and uploading

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadFileToGCS } from "@/lib/gcs";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const holographId = searchParams.get("holographId");

    if (!holographId) {
        return NextResponse.json({ error: "Holograph ID is required" }, { status: 400 });
    }

    try {
        const documents = await prisma.vitalDocument.findMany({
            where: { holographId },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        // 🔍 Debug: Log all received fields
        console.log("🟢 Received Form Data:", Object.fromEntries(formData.entries()));

        const holographId = formData.get("holographId") as string;
        const name = formData.get("name") as string;
        const type = formData.get("type") as string;
        const notes = formData.get("notes") as string;
        const file = formData.get("file") as File;
        const uploadedBy = formData.get("uploadedBy") as string; // ✅ Get user ID

        // ✅ Log extracted values
        console.log("🟢 Parsed Fields:", { holographId, name, type, file, uploadedBy });

        if (!holographId || !name || !type || !file || !uploadedBy) {
            console.error("❌ Missing required fields:", { holographId, name, type, file, uploadedBy });
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const gcsFileName = `uploads/${Date.now()}-${file.name}`;
        const fileUrl = await uploadFileToGCS(file, gcsFileName);

        const newDocument = await prisma.vitalDocument.create({
            data: {
                holographId,
                name,
                type,
                notes: notes || null,
                filePath: fileUrl,
                uploadedBy,
            },
        });

        return NextResponse.json(newDocument, { status: 201 });
    } catch (error) {
        console.error("❌ Error uploading document:", error);
        return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
    }
}
