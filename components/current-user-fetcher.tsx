"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useGetUserById } from "@/hooks/use-user";

/**
 * When we have userId (after signup or on return), fetch the user and store in context + localStorage.
 * This runs whenever the app loads with a userId, so returning users get fresh data.
 * Context is hydrated from localStorage on init, so currentUser is available immediately (cached) until refetch completes.
 */
export function CurrentUserFetcher() {
  const { userId, setCurrentUser, hydrated } = useAuth();
  const { data, isSuccess } = useGetUserById(hydrated ? userId : null);

  useEffect(() => {
    if (isSuccess && data) {
      setCurrentUser(data);
    }
  }, [isSuccess, data, setCurrentUser]);

  return null;
}
