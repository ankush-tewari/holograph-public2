// src/app/auth-test/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { debugLog } from "../../utils/debug";

export default function AuthTest() {
  const { data: session, status } = useSession();
  
  return (
    <div>
      <h1>Auth Test Page</h1>
      <p>Status: {status}</p>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}