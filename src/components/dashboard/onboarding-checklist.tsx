"use client";

// Dismissible onboarding checklist rendered at the top of /dashboard.
// Auto-computes each step's completion from the providers (auth +
// bookmarks + reading progress), so a user who signed in yesterday
// and comes back fresh today sees the first step already ticked
// off. Dismissal is persisted in localStorage keyed on the user's
// sub claim so logging out + back in as someone else restores it.

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useBookmarks } from "@/lib/auth/bookmarks-context";
import { useReadingProgress } from "@/lib/auth/reading-progress-context";

const STORAGE_KEY_PREFIX = "siraj-noor.onboarding.dismissed.";

interface Step {
  id: string;
  label: string;
  detail: string;
  done: boolean;
}

export function OnboardingChecklist() {
  const { isAuthenticated, isReady, user, login } = useAuth();
  const { bookmarks } = useBookmarks();
  const { readSurahs, streak } = useReadingProgress();
  const [dismissed, setDismissed] = useState(true);

  // Per-user dismissal, sync'd from localStorage once the auth
  // provider has resolved. Server render gets dismissed=true so the
  // card doesn't flash in for signed-out visitors who don't want it.
  useEffect(() => {
    if (!isReady) return;
    const sub = user?.sub ?? "anonymous";
    const key = STORAGE_KEY_PREFIX + sub;
    const stored = typeof window !== "undefined" && localStorage.getItem(key);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(stored === "true");
  }, [isReady, user?.sub]);

  function dismiss() {
    const sub = user?.sub ?? "anonymous";
    const key = STORAGE_KEY_PREFIX + sub;
    if (typeof window !== "undefined") localStorage.setItem(key, "true");
    setDismissed(true);
  }

  const steps: Step[] = [
    {
      id: "sign-in",
      label: "Sign in with Quran.com",
      detail: "Bookmarks, collections, and streaks sync to your account.",
      done: isAuthenticated,
    },
    {
      id: "bookmark",
      label: "Bookmark your first ayah",
      detail: "Tap the flag icon next to any verse on a surah page.",
      done: bookmarks.length > 0,
    },
    {
      id: "explore",
      label: "Open a 3D view",
      detail:
        "Surah Structure, 99 Names, Prophet Timeline — pick any from the sidebar.",
      done: readSurahs.size > 0,
    },
    {
      id: "streak",
      label: "Read for 3 days in a row",
      detail: "Every surah view counts. The Activity heatmap tracks your days.",
      done: streak.current >= 3,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  // Auto-dismiss once all four complete — the checklist has served
  // its purpose. Don't need to persist this case; future mounts will
  // re-evaluate and re-hide.
  if (dismissed || doneCount === steps.length) return null;

  return (
    <section
      aria-labelledby="onboarding-heading"
      className="mb-6 rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.04] via-card to-card p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2
            id="onboarding-heading"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/80"
          >
            Getting started · {doneCount} / {steps.length}
          </h2>
          <p className="mt-1 text-base font-semibold text-foreground">
            Make Siraj Noor your own
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss getting-started checklist"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-rose-500/40 hover:text-rose-400"
        >
          ×
        </button>
      </div>

      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={`flex items-start gap-3 ${
              step.done ? "opacity-60" : ""
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-mono ${
                step.done
                  ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                  : "border-amber-500/50 text-amber-400"
              }`}
            >
              {step.done ? "✓" : i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  step.done ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-muted-foreground">{step.detail}</p>
              )}
            </div>
            {step.id === "sign-in" && !step.done && (
              <button
                type="button"
                onClick={() => login("/dashboard")}
                className="inline-flex h-8 items-center rounded-md bg-amber-500 px-3 text-xs font-semibold text-black hover:bg-amber-400"
              >
                Sign in
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
