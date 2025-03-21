// /src/app/api/vital-documents/[id]/route.ts - PUT & DELETE for Updating & Deleting Documents

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteFileFromGCS } from "@/lib/gcs";
import { uploadFileToGCS } from "@/lib/gcs"; // ✅ Ensure this import exists
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { debugLog } from "../../../../utils/debug";


export async function PUT(req: Request, { params }: { params: { id: string } }) {
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    
    try {
        // make sure user is authorized to see vital document 
        const document = await prisma.vitalDocument.findUnique({
            where: { id: params.id },
            include: {
                holograph: {
                select: {
                    principals: { select: { userId: true } },
                    delegates: { select: { userId: true } },
                },
                },
            },
            });
            
            if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
            }
            
            const isOwner = document.uploadedBy === userId;
            const isPrincipal = document.holograph.principals.some(p => p.userId === userId);
            const isDelegate = document.holograph.delegates.some(d => d.userId === userId);
            
            if (!(isOwner || isPrincipal )) {
            return NextResponse.json({ error: "Forbidden — no access to this document" }, { status: 403 });
            }         

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
  
    try {
      const document = await prisma.vitalDocument.findUnique({
        where: { id: params.id },
        include: {
          holograph: {
            select: {
              principals: { select: { userId: true } },
              delegates: { select: { userId: true } },
            },
          },
        },
      });
  
      if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
  
      const isOwner = document.uploadedBy === userId;
      const isPrincipal = document.holograph.principals.some(p => p.userId === userId);
  
      if (!(isOwner || isPrincipal)) {
        return NextResponse.json({ error: "Forbidden — only the owner or a principal can delete this document" }, { status: 403 });
      }
  
      await deleteFileFromGCS(document.filePath);
      await prisma.vitalDocument.delete({ where: { id: params.id } });
  
      return NextResponse.json({ message: "Document deleted successfully" }, { status: 200 });
    } catch (error) {
      console.error("Error deleting document:", error);
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
  }
  
