"use client";

import { useEffect, useState } from "react";

// The beforeinstallprompt event is a Chromium extension to the standard
// Event type. Typing it here as a minimal interface rather than pulling
// in a library so the surface stays explicit.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "siraj-noor-install-dismissed:v1";

// Minimum number of days a user must wait after dismissing before the
// prompt is shown again. Respects the user's decision without
// permanently silencing future install opportunities.
const DISMISS_COOLDOWN_DAYS = 14;

function wasRecentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = parseInt(raw, 10);
  if (Number.isNaN(dismissedAt)) return false;
  const daysElapsed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysElapsed < DISMISS_COOLDOWN_DAYS;
}

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // If the app is already installed (running in standalone or the
    // appinstalled event fired), skip the prompt entirely.
    if (window.matchMedia?.("(display-mode: standalone)").matches) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      if (wasRecentlyDismissed()) return;
      setIsVisible(true);
    };

    const onInstalled = () => {
      setIsVisible(false);
      setPromptEvent(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstall as EventListener
    );
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstall as EventListener
      );
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } catch (err) {
      console.error("[InstallPrompt] prompt failed:", err);
    } finally {
      // Whether accepted or dismissed, the event is single-use;
      // drop the reference so we don't try to prompt() twice.
      setPromptEvent(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // localStorage can throw in private browsing modes; degrading
      // to "shown again next visit" is acceptable.
    }
  };

  if (!isVisible || !promptEvent) return null;

  return (
    // Non-blocking promotional banner, not a modal. `role="region"` is
    // the accurate semantic - the user can continue interacting with
    // the page behind it. A true dialog would need focus-trap + Escape
    // handling, which is overkill for an optional install CTA.
    <div
      role="region"
      aria-label="Install Siraj Noor"
      className="fixed bottom-4 right-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-xl border border-amber-500/30 bg-card/95 p-4 shadow-2xl shadow-black/40 backdrop-blur"
    >
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/80">
        Install Siraj Noor
      </p>
      <p className="mb-3 text-sm leading-relaxed text-foreground/90">
        One tap to install on your home screen. Works offline, feels native,
        and keeps your streak right where you left it.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-amber-500 px-3 text-sm font-semibold text-black transition-colors hover:bg-amber-400 md:h-9"
        >
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex h-11 items-center justify-center rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/60 hover:text-foreground md:h-9"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
