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
  const sentRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    if (sentRef.current === chapterId) return;
    sentRef.current = chapterId;
    void recordRead(chapterId);
  }, [chapterId, isAuthenticated, isReady, recordRead]);

  return null;
}
