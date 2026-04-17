import type { MetadataRoute } from "next";

// Required under `output: "export"`. Without this directive Next.js
// treats the route as potentially dynamic and refuses to pre-render it
// at build time, which fails the static export with "export const
// dynamic = force-static not configured on route /manifest.webmanifest".
export const dynamic = "force-static";

// Next.js 16 file-based manifest convention. Generates
// /manifest.webmanifest at build time and injects the <link rel="manifest">
// tag into every route. Theme and background colours match the site's
// dark + amber visual identity so the install prompt splash screen on
// Android and the standalone title bar on desktop look continuous with
// the app itself.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Siraj Noor - Qur'an & Hadith Companion",
    short_name: "Siraj Noor",
    description:
      "Interactive 3D Qur'an and Hadith data visualisation with personal bookmarks, collections, streaks, daily goals, and reading activity. Powered by the Quran Foundation Content and User APIs.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#030308",
    theme_color: "#f59e0b",
    orientation: "portrait",
    lang: "en-GB",
    dir: "ltr",
    categories: ["education", "books", "lifestyle"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
