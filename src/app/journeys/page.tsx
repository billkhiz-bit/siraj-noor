"use client";

import dynamic from "next/dynamic";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Loading3DScene } from "@/components/dashboard/loading-skeleton";

const JourneysMap = dynamic(
  () =>
    import("@/components/dashboard/journeys-map").then((m) => ({
      default: m.JourneysMap,
    })),
  {
    ssr: false,
    loading: () => <Loading3DScene label="Loading Islamic Journeys map" />,
  }
);

export default function JourneysPage() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden p-2 pt-14 md:pt-2">
        <JourneysMap />
      </main>
    </div>
  );
}
