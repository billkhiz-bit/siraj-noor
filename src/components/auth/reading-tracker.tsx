"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useReadingProgress } from "@/lib/auth/reading-progress-context";

interface ReadingTrackerProps {
  chapterId: number;
}

export function ReadingTracker({ chapterId }: ReadingTrackerProps) {
  const { isAuthenticated, isReady } = useAuth();
  const { recordRead } = useReadingProgress();

  // Track which chapters have been successfully recorded in this mount.
  // A plain ref (previously) set the id synchronously before the POST
  // resolved - a failed POST would still block retry. Now we set the
  // id BEFORE the request to prevent double-fires across re-renders,
  // then roll it back on failure so a subsequent effect tick or a
  // remount can legitimately retry.
  const claimedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    if (claimedRef.current.has(chapterId)) return;

    claimedRef.current.add(chapterId);
    void recordRead(chapterId).then((ok) => {
      if (!ok) claimedRef.current.delete(chapterId);
    });
  }, [chapterId, isAuthenticated, isReady, recordRead]);

  return null;
}
