import { useCallback, useEffect, useRef, useState } from "react";
import { getMyMatches } from "../services/api";
import { subscribeToNotifications } from "../services/notifications";
import type { MatchResponseDTO } from "../services/types";

export type MatchingState =
  | "IDLE"
  | "CREATING_AD"
  | "AD_CREATED"
  | "SEARCHING"
  | "MATCH_FOUND"
  | "NO_MATCH"
  | "SEARCH_FAILED";

const PENDING_AD_ID_KEY = "pendingMatchingAdId";
const PENDING_AD_TIMESTAMP_KEY = "pendingMatchingAdTimestamp";
const MAX_PENDING_MS = 5 * 60 * 1000; // 5 minutes

export function useAdMatchingMachine() {
  const [state, setState] = useState<MatchingState>("IDLE");
  const [adId, setAdId] = useState<number | null>(null);
  const [matches, setMatches] = useState<MatchResponseDTO[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const pollCountRef = useRef<number>(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeAdIdRef = useRef<number | null>(null);

  activeAdIdRef.current = adId;

  const clearTimers = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    pollCountRef.current = 0;
    setState("IDLE");
    setAdId(null);
    setMatches([]);
    setErrorMessage("");
    try {
      sessionStorage.removeItem(PENDING_AD_ID_KEY);
      sessionStorage.removeItem(PENDING_AD_TIMESTAMP_KEY);
    } catch {}
  }, [clearTimers]);

  const checkMatchingStatus = useCallback(
    async (targetAdId: number): Promise<boolean> => {
      try {
        const allMatches = await getMyMatches();
        if (!Array.isArray(allMatches)) return false;

        const adMatches = allMatches.filter((m) => {
          const matchAdId = m.myAdId ?? m.myAd?.id;
          return matchAdId === targetAdId;
        });

        if (adMatches.length > 0) {
          setMatches(adMatches);
          setState("MATCH_FOUND");
          try {
            sessionStorage.removeItem(PENDING_AD_ID_KEY);
            sessionStorage.removeItem(PENDING_AD_TIMESTAMP_KEY);
          } catch {}
          return true;
        }
        return false;
      } catch (err) {
        console.error("Match status check error:", err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Eşleşme araması sırasında bir sorun oluştu.",
        );
        setState("SEARCH_FAILED");
        try {
          sessionStorage.removeItem(PENDING_AD_ID_KEY);
          sessionStorage.removeItem(PENDING_AD_TIMESTAMP_KEY);
        } catch {}
        return true;
      }
    },
    [],
  );

  const startAdCreation = useCallback(() => {
    clearTimers();
    setState("CREATING_AD");
    setErrorMessage("");
  }, [clearTimers]);

  const scheduleNextPoll = useCallback((targetAdId: number) => {
    clearTimers();
    pollCountRef.current += 1;

    // Max 6 polls (approx 15 seconds)
    if (pollCountRef.current > 6) {
      setState("NO_MATCH");
      try {
        sessionStorage.removeItem(PENDING_AD_ID_KEY);
        sessionStorage.removeItem(PENDING_AD_TIMESTAMP_KEY);
      } catch {}
      return;
    }

    pollTimerRef.current = setTimeout(() => {
      void checkMatchingStatus(targetAdId).then((foundOrFailed) => {
        if (!foundOrFailed && activeAdIdRef.current === targetAdId) {
          scheduleNextPoll(targetAdId);
        }
      });
    }, 2500);
  }, [clearTimers, checkMatchingStatus]);

  const onAdCreated = useCallback(
    (newAdId: number) => {
      clearTimers();
      pollCountRef.current = 0;
      setAdId(newAdId);
      setState("SEARCHING");

      try {
        sessionStorage.setItem(PENDING_AD_ID_KEY, String(newAdId));
        sessionStorage.setItem(PENDING_AD_TIMESTAMP_KEY, String(Date.now()));
      } catch {}

      // Initial check
      void checkMatchingStatus(newAdId).then((foundOrFailed) => {
        if (foundOrFailed) return;
        scheduleNextPoll(newAdId);
      });
    },
    [clearTimers, checkMatchingStatus, scheduleNextPoll],
  );

  // Hydrate state from sessionStorage on mount (for refresh / reconnect resilience)
  useEffect(() => {
    try {
      const storedAdIdStr = sessionStorage.getItem(PENDING_AD_ID_KEY);
      const storedTimestampStr = sessionStorage.getItem(PENDING_AD_TIMESTAMP_KEY);

      if (storedAdIdStr && storedTimestampStr) {
        const storedAdId = parseInt(storedAdIdStr, 10);
        const storedTimestamp = parseInt(storedTimestampStr, 10);

        if (!isNaN(storedAdId) && Date.now() - storedTimestamp < MAX_PENDING_MS) {
          setAdId(storedAdId);
          setState("SEARCHING");
          void checkMatchingStatus(storedAdId).then((foundOrFailed) => {
            if (!foundOrFailed) {
              scheduleNextPoll(storedAdId);
            }
          });
        } else {
          sessionStorage.removeItem(PENDING_AD_ID_KEY);
          sessionStorage.removeItem(PENDING_AD_TIMESTAMP_KEY);
        }
      }
    } catch {}
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time notification subscription
  useEffect(() => {
    const unsubscribe = subscribeToNotifications(() => {
      if (state === "SEARCHING" && adId) {
        void checkMatchingStatus(adId);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [state, adId, checkMatchingStatus]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    state,
    adId,
    matches,
    errorMessage,
    startAdCreation,
    onAdCreated,
    reset,
    setState,
  };
}
