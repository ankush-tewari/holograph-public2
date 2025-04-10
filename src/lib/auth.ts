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
          return {
            id: "1",
            email: credentials?.email ?? "",
            firstName: "Test",
            lastName: "User",
          };
        },
      }),
    ],
    secret: "test-secret", // Hardcoded, not using env var
    session: { strategy: "jwt" }, // simplest session config
  };
}
