"use client";

import { useEffect, useRef, useState } from "react";

interface BackToTopProps {
  // Optional selector for the scroll container. Surah detail pages
  // have an inner <main className="overflow-y-auto"> that scrolls
  // instead of the document root, so the component needs to bind
  // to that element's scroll events and scroll it specifically.
  // Defaults to window scroll for pages that scroll the root.
  containerSelector?: string;
  // How far (in pixels) the user must scroll before the button
  // appears. Keeps it out of the way on short content.
  showAfterPx?: number;
}

export function BackToTop({
  containerSelector,
  showAfterPx = 400,
}: BackToTopProps) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLElement | Window | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Resolve the actual scroll source. containerSelector lets the
    // surah page target its inner <main>; without it we watch the
    // document root.
    const target: HTMLElement | Window = containerSelector
      ? (document.querySelector(containerSelector) as HTMLElement) ?? window
      : window;
    containerRef.current = target;

    const getScrollTop = () =>
      target === window
        ? window.scrollY
        : (target as HTMLElement).scrollTop;

    const onScroll = () => {
      setVisible(getScrollTop() > showAfterPx);
    };

    onScroll();
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [containerSelector, showAfterPx]);

  const scrollToTop = () => {
    const target = containerRef.current;
    if (!target) return;
    if (target === window) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      (target as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/40 bg-card/95 text-amber-400 shadow-lg shadow-black/30 backdrop-blur transition-all hover:border-amber-500/70 hover:bg-amber-500/15 hover:text-amber-300 md:h-11 md:w-11"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 15 V3" />
        <path d="M4 8 L9 3 L14 8" />
      </svg>
    </button>
  );
}
