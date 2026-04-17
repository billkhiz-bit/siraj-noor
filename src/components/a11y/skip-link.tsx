"use client";

// Visually-hidden "skip to main content" link that surfaces as the
// first focusable element on Tab. Screen reader and keyboard-only
// users jump past the sidebar to the page's content area without
// having to tab through every navigation item.
//
// Client component because it queries the DOM for the first <main>
// at click time. This works on every route (no per-page id
// required) and gracefully degrades if no main exists on the page.
//
// Honours user intent: the handler calls preventDefault on the
// anchor click so the browser doesn't also try to navigate to
// #main-content. The tabindex=-1 assignment on the target lets
// programmatic focus land on the main element without making it
// part of the normal tab order.
export function SkipLink() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = document.querySelector("main");
    if (!main) return;
    if (main.tabIndex === undefined || main.tabIndex < 0) {
      main.setAttribute("tabindex", "-1");
    }
    (main as HTMLElement).focus({ preventScroll: false });
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:inline-flex focus:h-11 focus:items-center focus:rounded-md focus:border focus:border-amber-500/60 focus:bg-card focus:px-4 focus:text-sm focus:font-medium focus:text-amber-400 focus:shadow-lg focus:outline-none"
    >
      Skip to main content
    </a>
  );
}
