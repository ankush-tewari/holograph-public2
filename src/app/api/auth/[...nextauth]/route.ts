// src/app/api/auth/[...nextauth]/route.ts

// export const dynamic = "force-dynamic"; // for debugging
// ✅ ADD this line:
export const runtime = "nodejs"; //again for debugging
import NextAuth from 'next-auth';
import { debugLog } from '@/utils/debug';
import { getAuthOptions } from '@/lib/auth';


const handler = async (...args: any[]) => {
  debugLog("📦 Loading auth handler dynamically");
  const authOptions = await getAuthOptions();
  return NextAuth(authOptions)(...args);
};

export { handler as GET, handler as POST };
