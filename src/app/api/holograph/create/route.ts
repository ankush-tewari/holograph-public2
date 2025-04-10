// /src/app/api/holograph/create/route.ts  
// POST Method

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import { verify, JwtPayload } from 'jsonwebtoken';
import { debugLog } from '@/utils/debug';
import { Storage } from "@google-cloud/storage";
import { exec } from "child_process";
import { generateSSLCertificate } from '@/lib/ssl';
import path from "path";
import fs from "fs";
import { holographSchema } from '@/validators/holographSchema';
import { ZodError } from "zod"; // ✅ For safe error handling
import { withCors, getCorsHeaders } from "@/utils/withCORS";
import Tokens from "csrf"; 


const storage = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;

if (!BUCKET_NAME) {
  throw new Error("❌ GCS_BUCKET_NAME is not defined in environment variables");
}



export const POST = withCors(async (request: Request) => {
  try {
    debugLog("🚀 Received request to create holograph");

    // 🔍 Log received cookies
    debugLog("🔍 Received Cookies:", request.headers.get('cookie'));

    // ✅ Manually extract `auth-token`
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const authToken = cookies['auth-token'];

    debugLog("🔑 Extracted Token:", authToken);

    let session = null;

    if (authToken) {
      try {
        // ✅ Verify the JWT token
        debugLog("🔍 Decoding JWT with secret:", process.env.JWT_SECRET);
        const decoded = verify(authToken, process.env.JWT_SECRET!);

        if (typeof decoded === 'object' && 'id' in decoded && 'email' in decoded) {
          debugLog("✅ Token successfully decoded:", decoded);
          session = { user: { id: decoded.id, email: decoded.email } };
        } else {
          debugLog("❌ Decoded token does not contain expected fields:", decoded);
        }
      } catch (err) {
        debugLog("❌ Token verification failed:", err);
      }
    }

    // ✅ Fallback: Try NextAuth session if JWT failed
    if (!session) {
      debugLog("🔄 Trying getServerSession as a fallback...");
      const authOptions = await getAuthOptions();
      session = await getServerSession(authOptions);
    }

    debugLog("🔑 Final Session:", session);

    if (!session || !session.user?.id) {
      console.error("❌ Unauthorized - No session found!");
      return NextResponse.json({ error: 'Unauthorized - Session not found' }, { status: 401 });
    }

    debugLog("✅ Session verified. User ID:", session.user.id);

    // ✅ CSRF Verification (add after session.user.id check)
    const tokens = new Tokens();
    const csrfToken = request.headers.get("x-csrf-token");
    const csrfSecret = request.headers.get("cookie")?.match(/csrfSecret=([^;]+)/)?.[1];

    if (!csrfToken || !csrfSecret || !tokens.verify(csrfSecret, csrfToken)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    // Extract request data
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const geography = formData.get("geography") as string;
    debugLog("📌 Parsed FormData:", { title, geography });


    // ✅ Zod Validation
    try {
      holographSchema.parse({ title, geography });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ errors: err.errors }, { status: 400 });
      }
      throw err; // Rethrow if it’s not a Zod error
    }

    // ✅ Create holograph and principal relationship in a transaction
    const result = await prisma.$transaction(async (tx) => {
    debugLog("✅ Creating holograph for user:", session.user.id);

    const holograph = await tx.holograph.create({
      data: {
        title,
        geography,
        ownerId: session.user.id,  // ✅ Set ownerId to creator
      },
    });
    

    debugLog("✅ Creating principal relationship.");
    await tx.holographPrincipal.create({
      data: {
        userId: session.user.id,
        holographId: holograph.id,
      },
    });

    debugLog("🔐 Generating SSL Certificate...");
    let sslCertPath = null;
    let sslKeyPath = null;
    let aesKeyPath = null;

    try {
      const sslPaths = await generateSSLCertificate(holograph.id);
      sslCertPath = sslPaths.sslCertPath;
      sslKeyPath = sslPaths.sslKeyPath;
      aesKeyPath = sslPaths.aesKeyPath; // 🔐 Add AES key
      debugLog("✅ SSL Certificate and AES Key generated:", sslPaths);
    } catch (sslError) {
      console.error("❌ SSL Generation Failed:", sslError);
    }
    
    // ✅ Step 3: Update Holograph with all key paths — fail if not generated
    if (!sslCertPath || !sslKeyPath || !aesKeyPath) {
      throw new Error("❌ SSL or AES key was not created. Aborting Holograph creation.");
    }

    await tx.holograph.update({
      where: { id: holograph.id },
      data: { sslCertPath, sslKeyPath, aesKeyPath },
    });
    debugLog("✅ Holograph updated with SSL and AES key paths.");


    // ✅ Step 4: Attach Default Sections to the New Holograph
    debugLog("📌 Fetching default sections...");
    const defaultSections = await tx.section.findMany({ 
      where: { isDefault: true },
      orderBy: { order: "asc"}, 
    });

    if (defaultSections.length > 0) {
      debugLog(`✅ Found ${defaultSections.length} default sections. Attaching...`);
      await tx.holographSection.createMany({
        data: defaultSections.map((section) => ({
          holographId: holograph.id,
          sectionId: section.id,
          order: section.order,
        })),
      });
      debugLog("✅ Default sections successfully attached.");
      // ✅ Log initial ownership in OwnershipAuditLog
      await tx.ownershipAuditLog.create({
        data: {
          holographId: holograph.id,
          oldOwnerId: null,  // First owner, no previous owner
          currentOwnerId: session.user.id,
        },
      });
      debugLog("📜 OwnershipAuditLog created for initial owner.");
    } else {
      debugLog("⚠️ No default sections found. Skipping.");
    }
    return { ...holograph, sslCertPath, sslKeyPath };
  });

  debugLog("🎉 Successfully created holograph:", result);
  
  // ✅ Response with proper CORS headers
  const response = NextResponse.json({
    id: result.id,
    title: result.title,
    geography: result.geography, 
    sslCertPath: result.sslCertPath,
    sslKeyPath: result.sslKeyPath,
    lastModified: result.updatedAt.toISOString(),
  });
  
/*
  response.headers.append('Access-Control-Allow-Credentials', 'true');
  response.headers.append('Access-Control-Allow-Origin', 'http://localhost:3000'); // Adjust for production
  response.headers.append('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
*/

  return response;
  } catch (error: any) {
    console.error("❌ Detailed error creating holograph:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to create holograph' },
      { status: 500 }
    );
  }
});


export function OPTIONS(request: Request) {
  const origin = request.headers.get("origin") || "";
  const headers = getCorsHeaders(origin);
  const res = new Response(null, { status: 204 });
  for (const [key, value] of Object.entries(headers)) {
    res.headers.set(key, value);
  }
  return res;
}

// DELETE
export const GET = withCors(async () =>
  NextResponse.json({ message: "GET method alive!" }) // <- change message
);



