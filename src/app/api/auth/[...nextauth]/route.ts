// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const dynamic = "force-dynamic";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        console.log("⚡ authorize called with:", credentials?.email);
        
        // For testing, accept any credentials
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
  pages: {
    signIn: '/login',
  },
});

export { handler as GET, handler as POST };