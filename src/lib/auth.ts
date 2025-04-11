import CredentialsProvider from "next-auth/providers/credentials";
import { type NextAuthOptions } from "next-auth";

export async function getAuthOptions(): Promise<NextAuthOptions> {
  console.log("⚡ getAuthOptions called");
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
          console.log("✅ authorize called");
          return { id: "1", email: credentials?.email || "" };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        console.log("🟡 jwt called", { token, user });
        if (user) token.userId = user.id;
        return token;
      },
      async session({ session, token }) {
        console.log("🔵 session called", { session, token });
        if (session.user) session.user.id = token.userId;
        return session;
      },
    },
  };
}
