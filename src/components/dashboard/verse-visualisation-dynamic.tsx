"use client";

// Thin client-side wrapper that dynamically imports the 3D verse chart
// so the full three.js + drei + postprocessing stack (~1.27 MB gzipped
// minor variation) isn't in the first-paint bundle of every surah
// detail page. The surah page itself is a server component (async,
// generateStaticParams over 114 chapters) so it can't call
// next/dynamic directly — this wrapper bridges the two worlds.

import dynamic from "next/dynamic";

function LoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading 3D verse structure chart"
      className="h-[350px] animate-pulse rounded-lg border border-border bg-card/40 md:h-[560px]"
    />
  );
}

export const VerseVisualisation = dynamic(
  () =>
    import("./verse-visualisation").then((m) => ({
      default: m.VerseVisualisation,
    })),
  { ssr: false, loading: LoadingSkeleton }
);
