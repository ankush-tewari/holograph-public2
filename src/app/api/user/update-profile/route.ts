//  /src/app/api/user/update-profile/route.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import validator from 'validator';
import { debugLog } from "../../../../utils/debug"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { firstName, lastName, email } = await req.json();

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {

    // check for valid format
    if (!validator.isEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
    }

    // ✅ Securely update user by ID
    await prisma.user.update({
      where: { id: session.user.id },  // changed from email
      data: { firstName, lastName, email },
    });

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
