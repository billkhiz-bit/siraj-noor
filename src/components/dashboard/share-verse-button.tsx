"use client";

// Share-as-image for an ayah. Renders verse + translation + attribution
// into a 1080x1350 canvas (Instagram / WhatsApp-friendly 4:5), exports
// as PNG. Uses navigator.share() with the blob on capable platforms
// (iOS Safari, Android Chrome, desktop Safari in some cases) and
// falls back to a download link elsewhere.
//
// Kept intentionally independent of the site's design system because
// the image has to look good standalone - it's going to be seen
// everywhere but on siraj-noor.pages.dev. Dark background, amber
// accent, and the site's name at the bottom so recipients know
// where it came from.

import { useState } from "react";

interface ShareVerseButtonProps {
  verseKey: string;
  arabic: string;
  translation?: string;
  surahEnglish?: string;
}

type Status = "idle" | "rendering" | "sharing" | "done" | "error";

// Pure canvas drawing routine - call with an offscreen 2D context and
// the verse data. Returns when drawing is complete.
async function drawVerse(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: Omit<ShareVerseButtonProps, "arabic"> & { arabic: string }
) {
  // Dark gradient background, amber hairline frame.
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#0a0a1a");
  bg.addColorStop(1, "#020617");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Amber border
  ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  // Logo / mark in the top left
  ctx.fillStyle = "#f59e0b";
  ctx.font = '600 28px "Geist Mono", ui-monospace, SFMono-Regular, monospace';
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("SIRAJ NOOR", 56, 56);

  // Verse key (top right)
  ctx.fillStyle = "rgba(245, 158, 11, 0.8)";
  ctx.font = '500 24px "Geist Mono", ui-monospace, monospace';
  ctx.textAlign = "right";
  ctx.fillText(data.verseKey, width - 56, 56);

  // Arabic verse - centred vertically in the upper 60%, RTL
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";
  // Start with a generous font size and shrink if wrapping
  let arabicSize = 56;
  let arabicLines = wrapText(ctx, data.arabic, width - 160, arabicSize, "arabic");
  while (arabicLines.length > 4 && arabicSize > 30) {
    arabicSize -= 4;
    arabicLines = wrapText(ctx, data.arabic, width - 160, arabicSize, "arabic");
  }
  ctx.font = `500 ${arabicSize}px "Amiri", "Scheherazade New", "Noto Naskh Arabic", serif`;
  const arabicLineHeight = arabicSize * 1.7;
  const arabicTotalHeight = arabicLineHeight * arabicLines.length;
  const arabicStart = height * 0.3 - arabicTotalHeight / 2 + arabicLineHeight / 2;
  arabicLines.forEach((line, i) => {
    ctx.fillText(line, width / 2, arabicStart + i * arabicLineHeight);
  });

  // Separator
  ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 60, height * 0.52);
  ctx.lineTo(width / 2 + 60, height * 0.52);
  ctx.stroke();

  // Translation
  if (data.translation) {
    ctx.fillStyle = "#e2e8f0";
    ctx.direction = "ltr";
    ctx.textAlign = "center";
    let trSize = 32;
    let trLines = wrapText(
      ctx,
      data.translation,
      width - 180,
      trSize,
      "latin"
    );
    while (trLines.length > 8 && trSize > 20) {
      trSize -= 2;
      trLines = wrapText(ctx, data.translation, width - 180, trSize, "latin");
    }
    ctx.font = `400 ${trSize}px "Geist", "Inter", system-ui, sans-serif`;
    const trLineHeight = trSize * 1.5;
    const trTotalHeight = trLineHeight * trLines.length;
    const trStart = height * 0.72 - trTotalHeight / 2 + trLineHeight / 2;
    trLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, trStart + i * trLineHeight);
    });
  }

  // Surah name and attribution (bottom)
  ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
  ctx.font = '400 22px "Geist", "Inter", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  if (data.surahEnglish) {
    ctx.fillText(data.surahEnglish, width / 2, height - 100);
  }
  ctx.font = '500 18px "Geist Mono", ui-monospace, monospace';
  ctx.fillStyle = "rgba(245, 158, 11, 0.6)";
  ctx.fillText("siraj-noor.pages.dev", width / 2, height - 56);
}

// Simple word-wrap helper. Works for both RTL (Arabic) and LTR
// because we measure per-word and pack into lines; direction is
// set on the context by the caller.
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  script: "arabic" | "latin"
): string[] {
  // Set a matching font temporarily so measurements reflect real layout
  const prev = ctx.font;
  ctx.font =
    script === "arabic"
      ? `500 ${fontSize}px "Amiri", "Scheherazade New", "Noto Naskh Arabic", serif`
      : `400 ${fontSize}px "Geist", "Inter", system-ui, sans-serif`;

  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? current + " " + word : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);

  ctx.font = prev;
  return lines;
}

export function ShareVerseButton({
  verseKey,
  arabic,
  translation,
  surahEnglish,
}: ShareVerseButtonProps) {
  const [status, setStatus] = useState<Status>("idle");

  const handleClick = async () => {
    setStatus("rendering");
    try {
      const width = 1080;
      const height = 1350;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setStatus("error");
        return;
      }
      await drawVerse(ctx, width, height, {
        verseKey,
        arabic,
        translation,
        surahEnglish,
      });

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png", 0.95)
      );
      if (!blob) {
        setStatus("error");
        return;
      }

      const filename = `siraj-noor-${verseKey.replace(":", "-")}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      // Web Share API preferred - allows "send to Messages", "post to
      // Telegram" etc. without a download step.
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        setStatus("sharing");
        try {
          await navigator.share({
            title: surahEnglish
              ? `${surahEnglish} - ayah ${verseKey}`
              : `Ayah ${verseKey}`,
            text: translation ?? "",
            files: [file],
          });
          setStatus("done");
          return;
        } catch {
          // User cancelled or API rejected - fall through to download.
        }
      }

      // Download fallback
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const label =
    status === "rendering"
      ? "Rendering…"
      : status === "sharing"
        ? "Sharing…"
        : status === "done"
          ? "Saved"
          : status === "error"
            ? "Couldn't share"
            : "Share";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "rendering" || status === "sharing"}
      aria-label={`Share ayah ${verseKey} as an image`}
      className={
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-xs font-medium transition-colors md:h-8 md:w-8 " +
        (status === "done"
          ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
          : status === "error"
            ? "border-rose-500/60 bg-rose-500/15 text-rose-300"
            : "border-border text-muted-foreground hover:border-amber-500/40 hover:text-amber-400")
      }
      title={label}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Share arrow glyph */}
        <path d="M4 8v5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V8" />
        <path d="M8 2v9" />
        <path d="M5 5l3-3 3 3" />
      </svg>
    </button>
  );
}
