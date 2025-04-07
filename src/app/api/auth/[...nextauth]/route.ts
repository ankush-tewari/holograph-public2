// src/app/api/auth/[...nextauth]/route.ts

export const dynamic = "force-dynamic";
import NextAuth from 'next-auth';
import { debugLog } from '@/utils/debug';
import { authOptions } from '@/lib/auth';

if (!authOptions) {
  console.error("❌ authOptions is undefined! Check if `src/lib/auth.ts` exists.");
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
