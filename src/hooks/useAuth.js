import { useMemo } from "react";
import {
  useUser as clerkUseUserFn,
  useClerk as clerkUseClerkFn,
  useAuth as clerkUseAuthFn,
} from "@clerk/react";

const CLERK_KEY_RAW = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
if (!CLERK_KEY_RAW.startsWith("pk_")) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY is missing or invalid. Sign-in cannot run without it.");
}

export const useUser = clerkUseUserFn;
export const useClerk = clerkUseClerkFn;
export const useAuth = clerkUseAuthFn;
export function useSessionToken() {
  const auth = useAuth();
  return useMemo(() => {
    return async () => {
      if (!auth || typeof auth.getToken !== "function") return null;
      try {
        const token = await auth.getToken();
        return token || null;
      } catch (error) {
        console.error("Failed to fetch session token", error);
        return null;
      }
    };
  }, [auth]);
}
export default { useUser, useClerk, useAuth, useSessionToken };
