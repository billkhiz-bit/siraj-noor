"use client";

import { useEffect } from "react";

// Registers the /sw.js service worker after first paint.
//
// Intentionally gated to NODE_ENV=production so that `next dev` doesn't
// surprise you with aggressive offline caching during local development.
// On the Cloudflare Pages production build this always runs.
//
// Next.js's static-export build exposes NODE_ENV as a build-time string,
// so this gate is evaluated at bundle time and the dev-only branch is
// dead-code-eliminated from the production bundle.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    // Registration runs after the first idle callback so it doesn't
    // compete with the initial render for the main thread. The window
    // load event is a reliable idle signal across browsers that also
    // works on low-end mobile.
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("[SW] registration failed:", err);
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
