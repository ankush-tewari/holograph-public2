// src/lib/auth.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { debugLog } from "../utils/debug";

debugLog("AUTH OPTIONS LOADING");


export const authOptions: NextAuthOptions = {
  // Use the Prisma Adapter for database operations
  adapter: PrismaAdapter(prisma),

  // Configure authentication providers
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
        // Ensure credentials are defined before accessing properties
        if (!credentials || !credentials.email) {
          throw new Error("Invalid credentials provided");
        }

        // Fetch user from database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) throw new Error("No user found");

        // You would typically verify password here
        // For example: if (!await bcrypt.compare(credentials.password, user.password)) 
        //              throw new Error("Invalid password");

        // Return user info
        return {
          id: user.id,
          email: user.email,
          name: user.name
        };
      },
    }),
  ],

  // Use JWT for session strategy
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Set the overall secret
  secret: process.env.NEXTAUTH_SECRET,

  // Callbacks to customize JWT and session behavior
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      debugLog("✅ JWT Callback Triggered");
      
      // If this is an initial sign in
      if (user) {
        // Add user ID to the token
        token.userId = user.id;
      }
      
      // Check if this is a session update
      //if (trigger === 'update' && session) {
        // If there's a holographId in the session, add it to the token
      //  if (session.holographId) {
      //    token.holographId = session.holographId;
      //    debugLog("🔄 Updated token with holographId:", session.holographId);
      //  }
      //}

      // Handle updates to currentHolographId
      if (trigger === 'update' && session?.currentHolographId) {
        token.currentHolographId = session.currentHolographId;
        debugLog("🔄 Updated token with currentHolographId:", session.currentHolographId);
      }
      
      return token;
    },
    
    async session({ session, token }) {
      debugLog("✅ Session Callback Triggered");

      // Add the user ID to the session
      if (session.user) {
        session.user.id = token.userId || token.sub;
        
        // Add currentHolographId to the session if it exists in the token
        if (token.currentHolographId) {
          session.user.currentHolographId = token.currentHolographId as string;
          debugLog("✅ Added currentHolographId to session:", token.currentHolographId);
        }
      }

      return session;
    },
  },

  // Configure cookie settings
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
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

  // Enable debugging to help diagnose issues
  debug: process.env.NODE_ENV !== "production",
};

debugLog("AUTH OPTIONS LOADED SUCCESSFULLY");
export default NextAuth(authOptions);