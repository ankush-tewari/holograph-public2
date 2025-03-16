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

    if (!holographId) return NextResponse.json({ error: 'Missing holographId' }, { status: 400 });

    try {
        const permissions = await prisma.delegatePermissions.findMany({
        where: { holographId },
        include: { delegate: { select: { id: true, name: true, email: true } } }
        });

        return NextResponse.json(permissions);
    } catch (error) {
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
