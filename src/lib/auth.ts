// src/lib/auth.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
// import { prisma } from "@/lib/db"; // loading prisma later
import { debugLog } from "@/utils/debug";
import bcrypt from "bcryptjs"; // ✅ Import bcryptjs
import Tokens from "csrf";

debugLog("AUTH OPTIONS LOADING");


// ✅ Convert to a function that builds the options object
export async function getAuthOptions(): Promise<NextAuthOptions> {
  const { prisma } = await import("@/lib/db");

  return {
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
          if (!credentials?.email) throw new Error("Invalid credentials");
          const { prisma } = await import("@/lib/db");
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          if (!user) throw new Error("No user found");

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) throw new Error("Invalid password");

          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          };
        },
      }),
    ],
    session: {
      strategy: "jwt",
      maxAge: 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      async jwt({ token, user, trigger, session }) {
        debugLog("✅ JWT Callback Triggered");
        if (user) {
          token.userId = user.id;
          token.firstName = user.firstName;
          token.lastName = user.lastName;
          const tokens = new Tokens();
          token.csrfSecret = tokens.secretSync();
        }
        if (trigger === "update" && session?.currentHolographId) {
          token.currentHolographId = session.currentHolographId;
        }
        return token;
      },
      async session({ session, token }) {
        debugLog("✅ Session Callback Triggered");
        if (session.user) {
          session.user.id = token.userId;
          session.user.firstName = token.firstName;
          session.user.lastName = token.lastName;
          if (token.currentHolographId) {
            session.user.currentHolographId = token.currentHolographId as string;
          }
          session.csrfSecret = token.csrfSecret;
        }
        return session;
      },
    },
    cookies: {
      sessionToken: {
        name:
          process.env.NODE_ENV === "production"
            ? "__Secure-next-auth.session-token"
            : "next-auth.session-token",
        options: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        },
      },
    },
    debug: process.env.NODE_ENV !== "production",
  };
}

debugLog("AUTH OPTIONS LOADED SUCCESSFULLY");
