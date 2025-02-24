// /src/app/api/vital-documents/[id]/route.ts - PUT & DELETE for Updating & Deleting Documents

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteFileFromGCS } from "@/lib/gcs";
import { uploadFileToGCS } from "@/lib/gcs"; // ✅ Ensure this import exists


export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const formData = await req.formData();
        const name = formData.get("name") as string;
        const type = formData.get("type") as string;
        const notes = formData.get("notes") as string;
        const file = formData.get("file") as File | null;

        if (!name || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // ✅ Define `updatedData` to include optional `filePath`
        let updatedData: { 
            name: string; 
            type: string; 
            notes: string | null; 
            filePath?: string; // ✅ Make `filePath` optional
        } = {
            name,
            type,
            notes: notes || null,
        };

        if (file) {
            // ✅ Upload new file and update filePath
            const gcsFileName = `uploads/${Date.now()}-${file.name}`;
            const fileUrl = await uploadFileToGCS(file, gcsFileName);
            updatedData.filePath = fileUrl; // ✅ Fix: Correctly add `filePath`
        }

        const updatedDocument = await prisma.vitalDocument.update({
            where: { id: params.id },
            data: updatedData,
        });

        return NextResponse.json(updatedDocument);
    } catch (error) {
        console.error("Error updating document:", error);
        return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const document = await prisma.vitalDocument.findUnique({ where: { id: params.id } });
        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // ✅ Delete file from Google Cloud Storage
        await deleteFileFromGCS(document.filePath);

        await prisma.vitalDocument.delete({ where: { id: params.id } });

        return NextResponse.json({ message: "Document deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting document:", error);
        return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
}
