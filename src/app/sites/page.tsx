"use client";

import dynamic from "next/dynamic";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Loading3DScene } from "@/components/dashboard/loading-skeleton";

const SacredSites3D = dynamic(
  () =>
    import("@/components/dashboard/sacred-sites-3d").then((m) => ({
      default: m.SacredSites3D,
    })),
  {
    ssr: false,
    loading: () => <Loading3DScene label="Loading Sacred Sites 3D models" />,
  }
);

export default function SitesPage() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden p-2 pt-14 md:pt-2">
        <SacredSites3D />
      </main>
    </div>
  );
}
