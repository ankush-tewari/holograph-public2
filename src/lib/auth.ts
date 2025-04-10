import CredentialsProvider from "next-auth/providers/credentials";
import { type NextAuthOptions } from "next-auth";

export async function getAuthOptions(): Promise<NextAuthOptions> {
  return {
    secret: "test-secret",
    session: { strategy: "jwt" },
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          console.log("✅ [authorize] credentials received:", credentials);
          return {
            id: "1",
            email: credentials?.email ?? "no-email@example.com",
            firstName: "Test",
            lastName: "User",
          };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        console.log("🟡 [jwt] token start:", token);
        if (user) {
          token.userId = user.id;
        }
        return token;
      },
      async session({ session, token }) {
        console.log("🔵 [session] start:", session);
        session.user.id = token.userId;
        return session;
      },
    },
  };
}
