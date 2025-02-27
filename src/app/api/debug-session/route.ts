// /src/app/api/debug-session/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt, { JsonWebTokenError, TokenExpiredError, NotBeforeError } from "jsonwebtoken";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        console.log("🔍 Debug: `getServerSession()` returned:", session);

        // ✅ Check if NextAuth is reading the token
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get("auth-token"); // ✅ Try getting token manually

        if (!tokenCookie) {
            console.error("❌ No auth token found in cookies");
            return NextResponse.json({ error: "No auth token found" }, { status: 401 });
        }

        console.log("🟢 Found token in cookies:", tokenCookie);

        // ✅ Manually decode JWT to verify it
        try {
            const decoded = jwt.verify(tokenCookie.value, process.env.NEXTAUTH_SECRET!);
            console.log("🟢 Decoded JWT token:", decoded);
            return NextResponse.json({ session, decodedToken: decoded });
        } catch (error) {
            console.error("❌ JWT Verification failed:", error);

            // ✅ Check the `name` property instead of using `instanceof`
            if ((error as jwt.JsonWebTokenError).name === "TokenExpiredError") {
                console.error("🔥 The token has expired!");
            } else if ((error as jwt.JsonWebTokenError).name === "JsonWebTokenError") {
                console.error("🔥 The token signature is invalid!");
            } else if ((error as jwt.JsonWebTokenError).name === "NotBeforeError") {
                console.error("🔥 The token is not yet active!");
            }

            return NextResponse.json({ error: "Invalid JWT token", details: (error as jwt.JsonWebTokenError).message }, { status: 401 });
        }
    } catch (error) {
        console.error("❌ Error fetching session:", error);
        return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
    }
}
