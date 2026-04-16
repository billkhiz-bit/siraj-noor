"use client";

import dynamic from "next/dynamic";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Loading3DScene } from "@/components/dashboard/loading-skeleton";

const IsnadNetwork3D = dynamic(
  () =>
    import("@/components/dashboard/isnad-network-3d").then((m) => ({
      default: m.IsnadNetwork3D,
    })),
  {
    ssr: false,
    loading: () => <Loading3DScene label="Loading Isnad Network 3D graph" />,
  }
);

export default function IsnadPage() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-16 md:px-6 md:py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Isnad Network
            </h1>
            <p className="mt-2 text-muted-foreground">
              The chains of narration that preserved the hadith, from the Prophet
              ﷺ through the Companions to the Tabi&apos;in and beyond. Each node
              represents a narrator, sized by how many hadith they transmitted.
              Hover to highlight their connections.
            </p>
          </div>
          <IsnadNetwork3D />
        </div>
      </main>
    </div>
  );
}
