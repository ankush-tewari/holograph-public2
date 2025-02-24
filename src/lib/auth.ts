// /src/lib/auth.ts

import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import jwt from "jsonwebtoken";
import { verify } from "jsonwebtoken"; // Import JWT verification

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 🔹 Ensure credentials are defined before accessing properties
        if (!credentials || !credentials.email) {
            throw new Error("Invalid credentials provided");
        }
    
        // 🔹 Fetch user from database
        const user = await prisma.user.findUnique({
            where: { email: credentials.email },
        });
    
        if (!user) throw new Error("No user found");
    
        // 🔹 Generate an access token for the user
        const accessToken = jwt.sign(
            { userId: user.id },
            process.env.NEXTAUTH_SECRET as string, // Ensure this is defined in `.env`
            { expiresIn: "1h" }
        );
    
        // ✅ Return user + token
        return {
            id: user.id,
            email: user.email,
            accessToken, // 🔹 Include access token
        };
    }    
  }),
  ],
  session: {
    strategy: "jwt", // ✅ Ensure JWT strategy is enabled
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET, // ✅ Ensure secret is set
    maxAge: 30 * 24 * 60 * 60, // 30 days
},
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
        console.log("✅ JWT Callback Triggered: User:", user);

        if (user) {
            token.sub = user.id;
            token.accessToken = jwt.sign(
                { userId: user.id },
                process.env.NEXTAUTH_SECRET as string, // Ensure this is set in `.env`
                { expiresIn: "1h" }
            );
        }

        console.log("🟢 Updated Token Object:", token);
        return token;
    },
    async session({ session, token }) {
        console.log("✅ Session Callback Triggered: Token:", token);

        if (session.user) {
            session.user.id = token.sub!;
            session.user.accessToken = token.accessToken as string; // ✅ Pass JWT accessToken to session
        }

        console.log("🟢 Updated Session Object:", session);
        return session;
    },
},
  cookies: {
    sessionToken: {
      name: "auth-token", // ✅ Use `auth-token` instead of `next-auth.session-token`
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    },
  },
  debug: true, // ✅ Enable debugging to catch errors in logs
};
export default NextAuth(authOptions);