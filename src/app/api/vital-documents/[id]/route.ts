// /src/app/api/vital-documents/[id]/route.ts - PUT & DELETE for Updating & Deleting Documents

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteFileFromGCS } from "@/lib/gcs";
import { uploadFileToGCS } from "@/lib/gcs"; // ✅ Ensure this import exists
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { debugLog } from "@/utils/debug";
import { vitalDocumentSchema } from "@/validators/vitalDocumentSchema";
import { ZodError } from "zod";


export async function PUT(req: Request, { params }: { params: { id: string } }) {
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    let updatedBy: string | null = null; 
    
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
        const vitalDocumentId = formData.get("id") as string | null; // ✅ Extract the ID
        const name = formData.get("name") as string;
        const type = formData.get("type") as string;
        const notes = formData.get("notes") as string | null; // ✅ Fix: Ensure `notes` can be `null`
        const file = formData.get("file") as File | null;
        updatedBy = session.user.id

        try {
            vitalDocumentSchema.parse({
              name,
              type,
              notes,
            });
          } catch (err) {
            if (err instanceof ZodError) {
              return NextResponse.json({ errors: err.errors }, { status: 400 });
            }
            throw err;
          }
            
        if (!vitalDocumentId) {
            return NextResponse.json({ error: "Missing document ID" }, { status: 400 });
        }

        // ✅ Standardized file structure <holographId>/<section>/<timestamped-file-name>
        const section = "vital-documents"; // ✅ Define section name
        let updatedData: { 
            name: string; 
            type: string; 
            notes: string | null;
            updatedBy: string; 
            filePath?: string; // ✅ Make `filePath` optional
        } = {
            name,
            type,
            notes: notes || null,
            updatedBy: updatedBy,
        };

        if (file) {
            const timestampedFileName = `${Date.now()}-${file.name}`;
            const gcsFileName = `${document.holographId}/${section}/${timestampedFileName}`; // ✅ Standardized path
            const fileUrl = await uploadFileToGCS(file, gcsFileName);
            updatedData.filePath = fileUrl; // ✅ Ensure correct filePath update
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
      const vitalDocument = await prisma.vitalDocument.findUnique({
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
      
      if (!vitalDocument) {
          return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
      
      const isOwner = vitalDocument.uploadedBy === userId;
      const isPrincipal = vitalDocument.holograph.principals.some(p => p.userId === userId);
      
      if (!(isOwner || isPrincipal)) {
          return NextResponse.json({ error: "Forbidden — only the owner or a principal can delete this document" }, { status: 403 });
      }
  
      // ✅ Step 1: Delete file and update DB in a transaction
      await prisma.$transaction(async (tx) => {
        if (vitalDocument.filePath) {
          await deleteFileFromGCS(vitalDocument.filePath);
          debugLog("🗑️ GCS file deleted:", vitalDocument.filePath);
        }

        await tx.vitalDocument.delete({
          where: { id: params.id },
        });
      });
      
      debugLog(`✅ Vital Document ${params.id} deleted successfully`);
      return NextResponse.json({ message: "Document deleted successfully" }, { status: 200 });
      
    } catch (error) {
      console.error("Error deleting document:", error);
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
  }
  
