import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";

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
        }        
      }),
    ],
    session: {
      strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
  };
}
