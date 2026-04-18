"use client";

// Reads the OS-level "reduce motion" preference and re-renders the
// caller when the preference flips. Used to gate JS-driven animations
// (notably Three.js OrbitControls `autoRotate`) that CSS can't reach.
// The CSS-level prefers-reduced-motion block in globals.css handles
// keyframe animations and transitions; this hook handles the rest.

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  // SSR default: assume no preference so the server-rendered markup
  // and first client paint match. The post-mount effect flips the
  // flag for users who do want reduced motion.
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(QUERY);
    // Syncing from the browser media query must happen post-hydration;
    // SSR returns false by design so markup matches, and this effect
    // flips the flag for users who've opted into reduced motion.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mql.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  return reduced;
}
