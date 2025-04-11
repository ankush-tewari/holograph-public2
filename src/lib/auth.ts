import CredentialsProvider from "next-auth/providers/credentials";
import { type NextAuthOptions } from "next-auth";

export async function getAuthOptions(): Promise<NextAuthOptions> {
  console.log("⚡ getAuthOptions called");
  
  return {
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials, req) {
          // For testing, just return a user object without database check
          console.log("✅ TEST MODE: Authorization attempt for email:", credentials?.email);
          
          // Accept any credentials for testing
          if (credentials?.email && credentials?.password) {
            return {
              id: "test-123",
              email: credentials.email,
              name: "Test User"
            };
          }
          
          return null;
        },
      }),
    ],
    secret: process.env.NEXTAUTH_SECRET || "test-secret",
    session: { strategy: "jwt" },
    debug: true,
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.userId = user.id;
          token.email = user.email;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.userId as string;
        }
        return session;
      }
    },
    pages: {
      signIn: '/login',
      error: '/login',
    }
  };
}