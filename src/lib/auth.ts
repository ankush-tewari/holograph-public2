import CredentialsProvider from "next-auth/providers/credentials";
import { type NextAuthOptions } from "next-auth";
import { prisma } from "./db";
import { compare } from "bcrypt"; // Make sure bcrypt is installed

// Create a type that extends the NextAuth User type with your specific fields
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    image?: string | null;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      name?: string | null;
      image?: string | null;
    }
  }
}

export async function getAuthOptions(): Promise<NextAuthOptions> {
  console.log("⚡ getAuthOptions called");
  
  return {
    secret: process.env.NEXTAUTH_SECRET || "test-secret", // Use environment variable in production
    session: { strategy: "jwt" },
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials, req) {
          console.log("✅ authorize called with email:", credentials?.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Missing email or password");
            return null;
          }
          
          try {
            // Find user by email
            const user = await prisma.user.findUnique({
              where: { email: credentials.email }
            });
            
            console.log("🔍 User found:", !!user);
            
            if (!user) {
              console.log("❌ No user found with email:", credentials.email);
              return null;
            }
            
            // Check if the user has a password
            if (!user.password) {
              console.log("❌ User has no password");
              return null;
            }
            
            // Check password
            const passwordMatch = await compare(credentials.password, user.password);
            console.log("🔑 Password match:", passwordMatch);
            
            if (!passwordMatch) {
              console.log("❌ Password does not match");
              return null;
            }
            
            console.log("✅ Authentication successful for user:", user.id);
            
            // Return user data matching our extended User type
            return {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              name: `${user.firstName} ${user.lastName}`, // Create full name for compatibility
              image: null // Include for compatibility with NextAuth defaults
            };
          } catch (error) {
            console.error("❌ Error in authorize function:", error);
            return null;
          }
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        console.log("🟡 jwt called", { tokenId: token.sub, userId: user?.id });
        if (user) {
          // Add user data to the token
          token.userId = user.id;
          token.email = user.email;
          token.firstName = user.firstName;
          token.lastName = user.lastName;
        }
        return token;
      },
      async session({ session, token }) {
        console.log("🔵 session called", { sessionUserId: session.user?.id, tokenUserId: token.userId });
        if (session.user) {
          // Add user data to the session
          session.user.id = token.userId as string;
          session.user.firstName = token.firstName as string;
          session.user.lastName = token.lastName as string;
          session.user.name = `${token.firstName} ${token.lastName}`; // For compatibility
        }
        return session;
      },
    },
    pages: {
      signIn: '/login',
      error: '/login', // Error code passed in query string as ?error=
    },
    debug: process.env.NODE_ENV === 'development',
  };
}