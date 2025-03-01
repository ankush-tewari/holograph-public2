// /src/app/api/generate-signed-url/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/db"; // ✅ Import Prisma to check permissions
import { debugLog } from "../../../utils/debug";

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME as string);

export async function GET(req: NextRequest) {
  try {
    debugLog("🔍 Checking user session...");

    // ✅ Retrieve cookies properly
    const cookieStore = cookies();
    const authToken = await cookieStore.get("auth-token");
    debugLog("🟢 Retrieved Cookies: ", authToken);

    // ✅ Authenticate user with NextAuth
    let session = await getServerSession(authOptions);
    debugLog("✅ Retrieved session:", session);

    // 🔴 If no session, attempt manual JWT verification
    if (!session || !session.user) {
      console.warn("⚠️ No valid session from NextAuth. Attempting manual JWT verification...");

      if (!authToken) {
        console.error("❌ No auth token found in cookies");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        const decodedToken = jwt.verify(authToken.value, process.env.NEXTAUTH_SECRET!) as JwtPayload;
        session = {
          user: {
            id: decodedToken.id as string,
            email: decodedToken.email as string,
          },
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
      } catch (error) {
        console.error("❌ JWT Verification Failed:", error);
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    }

    debugLog(`🟢 User ${session.user.email} requested a signed URL`);

    // ✅ Extract filePath and holographId from query parameters
    const { searchParams } = new URL(req.url);
    let filePath = searchParams.get("filePath");
    const holographId = searchParams.get("holographId");

    if (!filePath || !holographId) {
      console.error("❌ Missing filePath or holographId in request.");
      return NextResponse.json({ error: "Missing filePath or holographId" }, { status: 400 });
    }

    // ✅ Ensure filePath is stored correctly in DB
    if (filePath.startsWith("https://storage.googleapis.com/holograph-user-documents/")) {
      filePath = filePath.replace("https://storage.googleapis.com/holograph-user-documents/", "");
    }

    debugLog("🟢 Corrected filePath for DB lookup:", filePath);

    // ✅ Verify user has access to the document
    const document = await prisma.vitalDocument.findUnique({
      where: {
        holographId_filePath: {
          holographId,
          filePath,
        },
      },
      select: {
        id: true,
        holographId: true,
        uploadedBy: true,
        holograph: {
          select: {
            principals: { select: { userId: true } },
            delegates: { select: { userId: true } },
          },
        },
      },
    });

    if (!document) {
      console.error("❌ Document not found for filePath:", filePath);
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    debugLog("✅ Document found:", document);

    const userId = session.user.id;
    const isOwner = document.uploadedBy === userId;
    const isAuthorizedPrincipal = document.holograph.principals.some((p) => p.userId === userId);
    const isAuthorizedDelegate = document.holograph.delegates.some((d) => d.userId === userId);

    if (!(isOwner || isAuthorizedPrincipal || isAuthorizedDelegate)) {
      console.error(`❌ Unauthorized: User ${userId} is not allowed to access this document.`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    debugLog("✅ User authorized to access this document.");

    // ✅ Generate the Signed URL
    debugLog("🟢 Generating signed URL for:", filePath);
    const file = bucket.file(filePath);

    try {
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 10 * 60 * 1000, // URL valid for 10 minutes
      });

      debugLog("✅ Signed URL generated:", signedUrl);
      return NextResponse.json({ url: signedUrl });
    } catch (error) {
      console.error("❌ Error generating signed URL:", error);
      return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

