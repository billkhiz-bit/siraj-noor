import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth/auth-context";
import { BookmarksProvider } from "@/lib/auth/bookmarks-context";
import { CollectionsProvider } from "@/lib/auth/collections-context";
import { ReadingProgressProvider } from "@/lib/auth/reading-progress-context";
import { StreakCelebration } from "@/components/dashboard/streak-celebration";
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
};

export const metadata: Metadata = {
  title: "Siraj Noor — Qur'an & Hadith Data Visualisation",
  description:
    "Interactive 3D dashboard illuminating the structure, themes, and connections within the Qur'an and Hadith collections, with personal bookmarks, collections, streaks, and reflections powered by Quran Foundation.",
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
                <TooltipProvider delay={300}>
                  {children}
                  <StreakCelebration />
                </TooltipProvider>
              </CollectionsProvider>
            </BookmarksProvider>
          </ReadingProgressProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
