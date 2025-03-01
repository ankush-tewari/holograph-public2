export const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG === "true";

export const debugLog = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log("[DEBUG]", ...args);
  }
};