"use client";

import dynamic from "next/dynamic";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Loading3DScene } from "@/components/dashboard/loading-skeleton";

const HadithExplorer3D = dynamic(
  () =>
    import("@/components/dashboard/hadith-explorer-3d").then((m) => ({
      default: m.HadithExplorer3D,
    })),
  {
    ssr: false,
    loading: () => <Loading3DScene label="Loading Hadith Explorer 3D towers" />,
  }
);

export default function HadithPage() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-16 md:px-6 md:py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Hadith Explorer
            </h1>
            <p className="mt-2 text-muted-foreground">
              The six canonical collections (Kutub al-Sittah) compared
              side by side. Each tower shows total vs authenticated hadith.
              Click a collection to reveal its topic breakdown by category.
            </p>
          </div>
          <HadithExplorer3D />
        </div>
      </main>
    </div>
  );
}
