// src/hooks/useHolograph.ts
"use client";

import { useSession } from "next-auth/react";
import { useCallback, useState, useEffect } from "react";
import { debugLog } from "@/utils/debug";

export function useHolograph() {
  const { data: session, update, status } = useSession();

  // ✅ Add hydration detection
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

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