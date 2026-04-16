import Link from "next/link";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { VerseVisualisation } from "@/components/dashboard/verse-visualisation-dynamic";
import { ChapterAudioPlayer } from "@/components/dashboard/chapter-audio-player";
import { VerseRow } from "@/components/dashboard/verse-row";
import { VerseProgressIndicator } from "@/components/dashboard/verse-progress-indicator";
import { ReadingTracker } from "@/components/auth/reading-tracker";
import { Badge } from "@/components/ui/badge";
import { surahs } from "@/lib/data/surahs";
import { fetchAllVerses, fetchChapterInfo } from "@/lib/quran-api";

export async function generateStaticParams() {
  return surahs.map((s) => ({ id: String(s.number) }));
}

export default async function SurahDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const surahNumber = parseInt(id, 10);
  const surah = surahs.find((s) => s.number === surahNumber);

  if (!surah) redirect("/dashboard");

  const [verses, chapterInfo] = await Promise.all([
    fetchAllVerses(surah.number),
    fetchChapterInfo(surah.number),
  ]);

  const prevSurah = surahNumber > 1 ? surahs[surahNumber - 2] : null;
  const nextSurah = surahNumber < 114 ? surahs[surahNumber] : null;

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <ReadingTracker chapterId={surah.number} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-16 md:px-6 md:py-8">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to Surah Structure
          </Link>

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {surah.number}. {surah.nameEnglish}
                </h1>
                <span className="font-mono text-3xl text-muted-foreground" dir="rtl">
                  {surah.nameArabic}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                &ldquo;{surah.meaning}&rdquo;
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={surah.type === "meccan" ? "default" : "secondary"}>
                  {surah.type === "meccan" ? "Meccan" : "Medinan"}
                </Badge>
                <Badge variant="outline">{surah.ayatCount} ayat</Badge>
                <Badge variant="outline">Revealed #{surah.revelationOrder}</Badge>
                <Badge variant="outline">Juz {surah.juz.join(", ")}</Badge>
              </div>
            </div>

            {/* Prev/Next nav */}
            <div className="flex gap-2 text-sm">
              {prevSurah && (
                <Link
                  href={`/surah/${prevSurah.number}`}
                  className="inline-flex h-11 items-center rounded-md border border-border px-3 text-muted-foreground hover:text-foreground transition-colors md:h-9"
                >
                  &larr; {prevSurah.nameEnglish}
                </Link>
              )}
              {nextSurah && (
                <Link
                  href={`/surah/${nextSurah.number}`}
                  className="inline-flex h-11 items-center rounded-md border border-border px-3 text-muted-foreground hover:text-foreground transition-colors md:h-9"
                >
                  {nextSurah.nameEnglish} &rarr;
                </Link>
              )}
            </div>
          </div>

          {/* Chapter info */}
          {chapterInfo?.short_text && (
            <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
              {chapterInfo.short_text}
              {chapterInfo.source && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({chapterInfo.source})
                </span>
              )}
            </p>
          )}

          {/* Recitation audio */}
          <ChapterAudioPlayer
            chapterId={surah.number}
            surahName={surah.nameEnglish}
          />
          <div className="mb-6" />


          {/* 3D Verse visualisation */}
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">Verse Structure</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Each bar represents one ayah. Height = word count. Hover for the
              Arabic text and English translation.
            </p>
            <VerseVisualisation verses={verses} surah={surah} />
          </div>

          {/* Verse listing */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">All Verses</h2>
            <VerseProgressIndicator verses={verses} />
            <div className="space-y-4">
              {verses.map((verse) => (
                <VerseRow
                  key={verse.verse_key}
                  verse={verse}
                  surahEnglish={`${surah.number}. ${surah.nameEnglish}`}
                />
              ))}
            </div>
          </div>

          {/* Source attribution */}
          <div className="mt-8 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Arabic text: Uthmani script via Qur&apos;an.com API v4.
              Translation: Sahih International.
              Revelation order: Egyptian Standard (Al-Azhar).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
