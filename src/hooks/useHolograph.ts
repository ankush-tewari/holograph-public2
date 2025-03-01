// src/hooks/useHolograph.ts
"use client";

import { useSession } from "next-auth/react";
import { useCallback } from "react";
import { debugLog } from "../utils/debug";

export function useHolograph() {
  const { data: session, update, status } = useSession();

  const setCurrentHolographId = useCallback(async (holographId: string) => {
    debugLog("🔄 Setting currentHolographId in session:", holographId);
    try {
      await update({
        currentHolographId: holographId,
      });
      debugLog("✅ Successfully updated session with currentHolographId");
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