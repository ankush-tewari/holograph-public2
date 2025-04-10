import CredentialsProvider from "next-auth/providers/credentials";
import { type NextAuthOptions } from "next-auth";

export async function getAuthOptions(): Promise<NextAuthOptions> {
  return {
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          console.log("🟢 [authorize] Received:", credentials);
          return {
            id: "1",
            email: credentials?.email ?? "",
            firstName: "Test",
            lastName: "User",
          };
        },
      }),
    ],

    session: {
      strategy: "jwt",
      maxAge: 60 * 60,
    },

    secret: "test-secret",

    callbacks: {
      async jwt({ token, user }) {
        console.log("🟡 [jwt] before:", token);
        if (user) {
          token.userId = user.id;
          token.firstName = user.firstName;
          token.lastName = user.lastName;
        }
        console.log("🟢 [jwt] after:", token);
        return token;
      },

      async session({ session, token }) {
        console.log("🔵 [session] input:", session, token);
        if (session.user) {
          session.user.id = token.userId;
          session.user.firstName = token.firstName;
          session.user.lastName = token.lastName;
        }
        console.log("🟢 [session] output:", session);
        return session;
      },
    },

    cookies: {
      sessionToken: {
        name: "next-auth.session-token",
        options: {
          httpOnly: true,
          secure: false, // disable for test
          sameSite: "lax",
          path: "/",
        },
      },
    },

    debug: true,
  };
}
