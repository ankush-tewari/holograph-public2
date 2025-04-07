// src/app/api/auth/[...nextauth]/route.ts


import NextAuth from 'next-auth';
import { debugLog } from '@/utils/debug';
import { getAuthOptions } from '@/lib/auth';

// export const dynamic = "force-dynamic"; // for debugging
// ✅ ADD this line:
export const runtime = "nodejs"; //again for debugging


const handler = async () => {
  debugLog("📦 Loading auth handler dynamically");
  const authOptions = await getAuthOptions();
  return NextAuth(authOptions);
};

// ✅ Export the awaited handler directly
const authHandler = await handler();
export { authHandler as GET, authHandler as POST };
