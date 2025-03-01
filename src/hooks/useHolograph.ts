// src/hooks/useHolograph.ts
"use client";

import { useSession } from "next-auth/react";
import { useCallback } from "react";

export function useHolograph() {
  const { data: session, update, status } = useSession();

  const setCurrentHolographId = useCallback(async (holographId: string) => {
    console.log("🔄 Setting currentHolographId in session:", holographId);
    try {
      await update({
        currentHolographId: holographId,
      });
      console.log("✅ Successfully updated session with currentHolographId");
    } catch (error) {
      console.error("❌ Error updating session:", error);
    }
  }, [update]);

  return {
    currentHolographId: session?.user?.currentHolographId,
    userId: session?.user?.id,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    setCurrentHolographId
  };
}