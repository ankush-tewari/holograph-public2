// src/app/api/auth/[...nextauth]/route.ts

export const dynamic = "force-dynamic";
import NextAuth from 'next-auth';
import { debugLog } from '@/utils/debug';
import { getAuthOptions } from '@/lib/auth';

if (!getAuthOptions) {
  console.error("❌ authOptions is undefined! Check if `src/lib/auth.ts` exists.");
}

const handler = async (...args: any[]) => {
  debugLog("📦 Loading auth handler dynamically");
  const authOptions = await getAuthOptions();
  return NextAuth(authOptions)(...args);
};

export { handler as GET, handler as POST };
