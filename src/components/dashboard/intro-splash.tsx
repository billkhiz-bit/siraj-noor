"use client";

// First-visit splash on /dashboard. Fullscreen amber bloom with the
// project name and a tagline, fades out after 4.5s or on click.
// Intentionally lightweight - no Three.js camera choreography, just
// CSS transforms and opacity - so it doesn't compete with the 3D
// Surah Ring rendering beneath it and can't regress on slower
// devices. Tracked via localStorage so returning users go straight
// into the app.

import { useEffect, useState } from "react";

const STORAGE_KEY = "siraj-noor.intro-splash.seen.v1";

export function IntroSplash() {
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen === "true") return;
    // Mark as seen immediately - if the user dismisses before the
    // autohide fires, we still don't want to replay it on the next
    // navigation.
    localStorage.setItem(STORAGE_KEY, "true");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);

    const autohide = window.setTimeout(() => setDismissing(true), 4000);
    const unmount = window.setTimeout(() => setVisible(false), 4600);
    return () => {
      window.clearTimeout(autohide);
      window.clearTimeout(unmount);
    };
  }, []);

  function dismiss() {
    setDismissing(true);
    window.setTimeout(() => setVisible(false), 550);
  }

  if (!visible) return null;

  return (
    <div
      role="presentation"
      onClick={dismiss}
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        dismissing ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {/* Concentric pulsing rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[800px] w-[800px] max-w-[90vw] max-h-[90vh] rounded-full bg-amber-500/10 blur-[120px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-80 w-80 rounded-full border border-amber-500/30 opacity-50"
          style={{ animation: "sn-splash-pulse 2.2s ease-out infinite" }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-[480px] w-[480px] rounded-full border border-amber-500/20 opacity-40"
          style={{ animation: "sn-splash-pulse 2.2s ease-out 0.4s infinite" }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-[680px] w-[680px] rounded-full border border-amber-500/10 opacity-30"
          style={{ animation: "sn-splash-pulse 2.2s ease-out 0.8s infinite" }}
        />
      </div>

      <div
        className="relative text-center"
        style={{ animation: "sn-splash-rise 1.2s ease-out" }}
      >
        <p
          className="mb-3 font-mono text-[11px] uppercase tracking-[0.4em] text-amber-500/80"
          style={{ animation: "sn-splash-fade 1.4s ease-out 0.1s both" }}
        >
          Bismillah
        </p>
        <h1
          className="font-mono text-6xl font-bold text-amber-500 md:text-8xl"
          style={{ animation: "sn-splash-fade 1.4s ease-out 0.4s both" }}
        >
          SIRAJ NOOR
        </h1>
        <p
          className="mt-4 font-mono text-2xl text-muted-foreground md:text-3xl"
          dir="rtl"
          lang="ar"
          style={{
            fontFamily: '"Amiri", serif',
            animation: "sn-splash-fade 1.4s ease-out 0.7s both",
          }}
        >
          سراج نور
        </p>
        <p
          className="mt-6 max-w-md text-sm text-muted-foreground md:text-base"
          style={{ animation: "sn-splash-fade 1.4s ease-out 1.0s both" }}
        >
          Ten ways into the structure of the Qur&apos;an.
          <br />
          One account, synced across devices.
        </p>
        <p
          className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60"
          style={{ animation: "sn-splash-fade 1.4s ease-out 2.5s both" }}
        >
          Click to enter
        </p>
      </div>

      <style>{`
        @keyframes sn-splash-pulse {
          0% {
            transform: scale(0.92);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.15);
            opacity: 0;
          }
        }
        @keyframes sn-splash-fade {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes sn-splash-rise {
          0% {
            transform: translateY(32px);
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
