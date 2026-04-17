import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth/auth-context";
import { BookmarksProvider } from "@/lib/auth/bookmarks-context";
import { CollectionsProvider } from "@/lib/auth/collections-context";
import { ReadingProgressProvider } from "@/lib/auth/reading-progress-context";
import { GoalsProvider } from "@/lib/auth/goals-context";
import { StreakCelebration } from "@/components/dashboard/streak-celebration";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SkipLink } from "@/components/a11y/skip-link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f59e0b",
};

const SITE_URL = "https://siraj-noor.pages.dev";
const SITE_TITLE = "Siraj Noor - Qur'an & Hadith Data Visualisation";
const SITE_DESCRIPTION =
  "Interactive 3D dashboard illuminating the structure, themes, and connections within the Qur'an and Hadith collections, with personal bookmarks, collections, streaks, daily goals, and reflections powered by the Quran Foundation API.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "Siraj Noor",
  appleWebApp: {
    capable: true,
    title: "Siraj Noor",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon-maskable.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: "Siraj Noor",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_GB",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Siraj Noor - 3D Qur'an & Hadith companion powered by Quran Foundation",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.svg"],
  },
  keywords: [
    "Quran",
    "Hadith",
    "Islamic",
    "3D visualisation",
    "Ramadan",
    "Quran Foundation",
    "Muslim",
    "bookmarks",
    "reading habit",
  ],
  authors: [{ name: "Bilal Khizar" }],
  creator: "Bilal Khizar",
  publisher: "Siraj Noor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SkipLink />
        <AuthProvider>
          <ReadingProgressProvider>
            <BookmarksProvider>
              <CollectionsProvider>
                <GoalsProvider>
                  <TooltipProvider delay={300}>
                    {children}
                    <StreakCelebration />
                    <InstallPrompt />
                    <ServiceWorkerRegistration />
                  </TooltipProvider>
                </GoalsProvider>
              </CollectionsProvider>
            </BookmarksProvider>
          </ReadingProgressProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
