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

export const metadata: Metadata = {
  title: "Siraj Noor - Qur'an & Hadith Data Visualisation",
  description:
    "Interactive 3D dashboard illuminating the structure, themes, and connections within the Qur'an and Hadith collections, with personal bookmarks, collections, streaks, and reflections powered by Quran Foundation.",
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
