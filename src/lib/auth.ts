import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import { verify } from "jsonwebtoken"; // Import JWT verification

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      console.log("✅ Session Callback Triggered: Token Sub:", token.sub);
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user }) {
      console.log("✅ JWT Callback Triggered: User:", user);
      if (user) {
        token.sub = user.id;
      }
      return token;
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
};
