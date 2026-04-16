"use client";

// Shared loading skeleton for dynamically imported 3D dashboard views.
// Announces to screen readers that content is loading, maintains the
// same height as the live canvas so layout doesn't shift when the
// real scene hydrates in.

interface LoadingSkeletonProps {
  label?: string;
}

export function Loading3DScene({
  label = "Loading 3D view",
}: LoadingSkeletonProps = {}) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      className="h-[350px] animate-pulse rounded-lg border border-border bg-card/40 md:h-[560px]"
    />
  );
}
