import type { MetadataRoute } from "next";
import { surahs } from "@/lib/data/surahs";

// Required under `output: "export"`. Without this directive Next.js
// treats the sitemap route as potentially dynamic and refuses to
// pre-render it at static-export build time.
export const dynamic = "force-static";

// Base URL for absolute canonical links in the sitemap. Uses the
// production Pages alias; if the app moves to a custom domain this
// is the single place to update.
const SITE_URL = "https://siraj-noor.pages.dev";

// Public surfaces a crawler should index. Authenticated-only routes
// (bookmarks, collections, goals, activity heatmap detail) are
// omitted because they render only personal content behind OAuth
// and aren't useful as standalone search destinations. They live
// inside the crawlable `/dashboard` path instead.
const TOP_LEVEL_ROUTES = [
  "/",
  "/dashboard",
  "/words",
  "/isnad",
  "/prophets",
  "/hadith",
  "/map",
  "/journeys",
  "/names",
  "/sites",
  "/activity",
  "/bookmarks",
  "/collections",
  "/qibla",
  "/privacy",
  "/terms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const topLevel: MetadataRoute.Sitemap = TOP_LEVEL_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1.0 : 0.7,
  }));

  // Every surah detail page. 114 entries, content is effectively
  // permanent (verses don't change), so changeFrequency is yearly.
  const surahPages: MetadataRoute.Sitemap = surahs.map((s) => ({
    url: `${SITE_URL}/surah/${s.number}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.8,
  }));

  return [...topLevel, ...surahPages];
}
