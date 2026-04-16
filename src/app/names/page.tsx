"use client";

import dynamic from "next/dynamic";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Loading3DScene } from "@/components/dashboard/loading-skeleton";

const Names3D = dynamic(
  () =>
    import("@/components/dashboard/names-3d").then((m) => ({
      default: m.Names3D,
    })),
  {
    ssr: false,
    loading: () => <Loading3DScene label="Loading 99 Names 3D sphere" />,
  }
);

export default function NamesPage() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden p-2 pt-14 md:pt-2">
        <Names3D />
      </main>
    </div>
  );
}
