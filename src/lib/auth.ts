// src/lib/auth.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import jwt, { JwtPayload } from "jsonwebtoken";

// ----------------------------------------------------------------------------
// NEXTAUTH_SECRET should be set in your .env file to a strong, random value.
// ----------------------------------------------------------------------------

export const authOptions: NextAuthOptions = {
  // ---------------------------
  // Use the Prisma Adapter for database operations
  // ---------------------------
  adapter: PrismaAdapter(prisma),

  // ---------------------------
  // Configure one or more authentication providers.
  // ---------------------------
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

        // Generate an access token for the user (if needed)
        // We let NextAuth handle JWT signing automatically.
        // If you need an access token separately, you can add it as a field.
        const accessToken = jwt.sign(
          { userId: user.id },
          process.env.NEXTAUTH_SECRET as string,
          { expiresIn: "1h" }
        );

        // Return user info. NextAuth will merge this into the JWT.
        return {
          id: user.id,
          email: user.email,
          // Optionally include the accessToken in the user object if desired.
          accessToken,
        };
      },
    }),
  ],

  // ---------------------------
  // Use JWT for session strategy
  // ---------------------------
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  // ---------------------------
  // Configure JWT options.
  // NextAuth will handle signing and verifying the token.
  // ---------------------------
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ---------------------------
  // Set the overall secret
  // ---------------------------
  secret: process.env.NEXTAUTH_SECRET,

  // ---------------------------
  // Callbacks to customize JWT and session behavior.
  // We are not re-signing the token here, just adding the user id.
  // ---------------------------
  callbacks: {
    async jwt({ token, user }) {
      console.log("✅ JWT Callback Triggered: User:", user);
    
      // Dynamically set expiration from environment variable (default to 7 days)
      const expiresIn = Number(process.env.JWT_EXPIRATION_SECONDS) || 7 * 24 * 60 * 60; 
      const now = Math.floor(Date.now() / 1000); // Get current time in seconds
    
      // If logging in, initialize token properties
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.accessToken = jwt.sign(
          { userId: user.id },
          process.env.NEXTAUTH_SECRET as string,
          { expiresIn: expiresIn } // Use dynamic expiration
        );
        token.exp = now + expiresIn; // ✅ Explicitly store expiration as a number
      }
    
      // ✅ Ensure `token.exp` is always a number
      const tokenExp = token.exp as number | undefined; // Explicitly cast
    
      if (!tokenExp) {
        token.exp = now + expiresIn; // 🔹 Set expiration if missing
      }
    
      // 🔄 Refresh the token if expired
      if (tokenExp && now > tokenExp) {
        console.log("🔄 Token expired. Refreshing...");
    
        token.accessToken = jwt.sign(
          { userId: token.id },
          process.env.NEXTAUTH_SECRET as string,
          { expiresIn: expiresIn }
        );
        token.exp = now + expiresIn; // 🔄 Update expiration timestamp
      }
    
      console.log("🟢 Updated Token Object:", token);
      return token;
    },
    
    async session({ session, token }) {
      console.log("✅ Session Callback Triggered: Token:", token);

      // Ensure the session includes the user id from the token.
      if (session.user) {
        session.user.id = token.sub as string;
      }

      console.log("🟢 Updated Session Object:", session);
      return session;
    },
  },

  // ---------------------------
  // Configure cookie settings.
  // Use the default cookie name in development to avoid issues with custom names.
  // ---------------------------
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

  // ---------------------------
  // Enable debugging to help diagnose issues.
  // ---------------------------
  debug: true,
};

export default NextAuth(authOptions);
