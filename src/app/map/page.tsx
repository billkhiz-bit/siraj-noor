"use client";

import dynamic from "next/dynamic";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Loading3DScene } from "@/components/dashboard/loading-skeleton";

const RevelationMap = dynamic(
  () =>
    import("@/components/dashboard/revelation-map").then((m) => ({
      default: m.RevelationMap,
    })),
  {
    ssr: false,
    loading: () => <Loading3DScene label="Loading Revelation map" />,
  }
);

export default function MapPage() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden p-2 pt-14 md:pt-2">
        <RevelationMap />
      </main>
    </div>
  );
}
