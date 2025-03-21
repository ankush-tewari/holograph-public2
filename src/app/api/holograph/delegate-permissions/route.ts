// /src/app/api/holograph/delegate-permissions/route.ts

import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from "@/lib/auth"; // ✅ Ensure this is correctly imported
import { getServerSession } from "next-auth";
import { debugLog } from "../../../../utils/debug";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const holographId = searchParams.get('holographId');
  const userIdParam = searchParams.get('userId');

  if (!holographId) return NextResponse.json({ error: 'Missing holographId' }, { status: 400 });

  const sessionUserId = session.user.id;

  try {
    // Check if user is a Principal
    const isPrincipal = await prisma.holographPrincipal.findFirst({
      where: { holographId, userId: sessionUserId },
    });

    // Check if user is a Delegate
    const isDelegate = await prisma.holographDelegate.findFirst({
      where: { holographId, userId: sessionUserId },
    });

    // ✅ PRINCIPAL: Can fetch all or specific delegate permissions
    if (isPrincipal) {
      const whereClause = userIdParam
        ? { holographId, delegateId: userIdParam }
        : { holographId };

      const permissions = await prisma.delegatePermissions.findMany({
        where: whereClause,
        select: {
          delegateId: true,
          sectionId: true,
          accessLevel: true,
        },
      });

      return NextResponse.json(permissions);
    }

    // ✅ DELEGATE: Can only fetch their own permissions
    if (isDelegate) {
      if (userIdParam && userIdParam !== sessionUserId) {
        return NextResponse.json({ error: 'Forbidden — Delegates can only view their own permissions' }, { status: 403 });
      }

      const permissions = await prisma.delegatePermissions.findMany({
        where: { holographId, delegateId: sessionUserId },
        select: {
          sectionId: true,
          accessLevel: true,
        },
      });

      return NextResponse.json(permissions);
    }

    // ❌ Not a Principal or Delegate
    return NextResponse.json({ error: 'Forbidden — Not authorized' }, { status: 403 });

  } catch (error) {
    console.error("❌ Error fetching delegate permissions:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
    
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { holographId, delegateId, sectionId, accessLevel } = await req.json(); // ✅ Use sectionId

    if (!holographId || !delegateId || !sectionId || !accessLevel) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
        const updatedPermission = await prisma.delegatePermissions.upsert({
            where: {
                holographId_delegateId_sectionId: { // ✅ Updated composite key
                    holographId,
                    delegateId,
                    sectionId
                }
            },
            update: { accessLevel },
            create: { holographId, delegateId, sectionId, accessLevel },
        });

        return NextResponse.json(updatedPermission);
    } catch (error) {
        console.error("Error updating delegate permissions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
