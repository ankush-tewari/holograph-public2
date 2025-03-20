// types/next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
//      name?: string;
      firstName: string;           // ✅ Added
      lastName: string;            // ✅ Added
      accessToken?: string; // Optional access token
      currentHolographId?: string; // For storing the current holograph
    }
  }
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    accessToken?: string; // Optional access token
  }
}

// This is necessary to add holographId to the JWT token
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    email?: string;
    accessToken?: string;
    currentHolographId?: string;
  }
}