// src/lib/auth.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { debugLog } from "../utils/debug";
import bcrypt from "bcryptjs"; // ✅ Import bcryptjs

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

        // ✅ Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
    }

        // Return user info
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        };
      },
    }),
  ],

  // Use JWT for session strategy
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
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
        token.firstName = user.firstName;  // ✅ Add this
        token.lastName = user.lastName;    // ✅ Add this
      }
      

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
        session.user.firstName = token.firstName;  // ✅ Add this
        session.user.lastName = token.lastName;    // ✅ Add this
        
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