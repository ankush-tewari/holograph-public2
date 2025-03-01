// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { debugLog } from "../../../../utils/debug";

// ✅ Try absolute import first (Preferred)
 //import { authOptions } from '@/lib/auth';

// ✅ If absolute import fails, uncomment and use relative import:
import { authOptions } from '../../../../lib/auth';

if (!authOptions) {
  console.error("❌ authOptions is undefined! Check if `src/lib/auth.ts` exists.");
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
