// /src/app/api/holograph/create/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verify, JwtPayload } from 'jsonwebtoken';
import { debugLog } from "../../../../utils/debug";
import { Storage } from "@google-cloud/storage";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

const storage = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "holograph-user-documents";

// ✅ Function to Generate an SSL Certificate
async function generateSSLCertificate(holographId) {
  const certPath = path.join("/tmp", `${holographId}.crt`);
  const keyPath = path.join("/tmp", `${holographId}.key`);

  return new Promise((resolve, reject) => {
    const cmd = `
      openssl req -x509 -nodes -newkey rsa:2048 \
      -keyout ${keyPath} -out ${certPath} -days 365 \
      -subj "/CN=${holographId}"
    `;

    exec(cmd, async (error) => {
      if (error) {
        reject(`Error generating SSL cert: ${error.message}`);
        return;
      }

      // ✅ Ensure SSLs are stored in a dedicated folder in GCS
      const sslCertDest = `ssl/${holographId}.crt`;
      const sslKeyDest = `ssl/${holographId}.key`;

      try {
        await storage.bucket(BUCKET_NAME).upload(certPath, { destination: sslCertDest });
        await storage.bucket(BUCKET_NAME).upload(keyPath, { destination: sslKeyDest });

        // Clean up local files
        fs.unlinkSync(certPath);
        fs.unlinkSync(keyPath);

        resolve({ sslCertPath: sslCertDest, sslKeyPath: sslKeyDest });
      } catch (uploadError) {
        reject(`❌ Error uploading SSL files to GCS: ${uploadError.message}`);
      }
    });
  });
}

export async function POST(request: Request) {
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
      session = await getServerSession(authOptions);
    }

    debugLog("🔑 Final Session:", session);

    if (!session || !session.user?.id) {
      console.error("❌ Unauthorized - No session found!");
      return NextResponse.json({ error: 'Unauthorized - Session not found' }, { status: 401 });
    }

    debugLog("✅ Session verified. User ID:", session.user.id);

    // Extract request data
    const { title, geography } = await request.json();
    debugLog("📌 Received request with title:", title);

    // Validate input
    if (!title) {
      debugLog("❌ No title provided.");
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
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

    try {
      const sslPaths = await generateSSLCertificate(holograph.id);
      sslCertPath = sslPaths.sslCertPath;
      sslKeyPath = sslPaths.sslKeyPath;
      debugLog("✅ SSL Certificate generated:", sslPaths);
    } catch (sslError) {
      console.error("❌ SSL Generation Failed:", sslError);
    }

    // ✅ Step 3: Update Holograph with SSL paths
    if (sslCertPath && sslKeyPath) {
      await tx.holograph.update({
        where: { id: holograph.id },
        data: { sslCertPath, sslKeyPath },
      });
      debugLog("✅ Holograph updated with SSL paths.");
    } else {
      console.warn("⚠️ SSL Certificate was not created. Holograph saved without SSL.");
    }

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
  

  response.headers.append('Access-Control-Allow-Credentials', 'true');
  response.headers.append('Access-Control-Allow-Origin', 'http://localhost:3000'); // Adjust for production
  response.headers.append('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');

  return response;
  } catch (error: any) {
    console.error("❌ Detailed error creating holograph:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to create holograph' },
      { status: 500 }
    );
  }
}
