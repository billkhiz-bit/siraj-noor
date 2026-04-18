"use client";

// Per-verse tafsir toggle + panel.
//
// Split of responsibilities:
//   - TafsirButton: pure open/close toggle. Aware of `open` only.
//   - TafsirPanel:  owns its own tafsir-id state, fetch lifecycle,
//                   loading UI, and the picker chips. VerseRow just
//                   conditionally renders it.
//
// Tafsir preference (which tafsir the user wants to read) is persisted
// in localStorage via lib/tafsir-presets.ts. Changing it in one panel
// is saved globally so the next panel the user opens uses the same
// preference without them having to reselect. In-flight open panels
// don't auto-update to the new preference - the user closes and
// reopens if they want to see a different tafsir on an already-open
// verse. Worthwhile simplification; panels can re-fetch cheaply from
// the browser cache.

import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { fetchTafsir, type Tafsir } from "@/lib/quran-api";
import {
  TAFSIR_PRESETS,
  DEFAULT_TAFSIR_ID,
  loadTafsirPreference,
  saveTafsirPreference,
} from "@/lib/tafsir-presets";

// Whitelist tailored to the actual HTML shapes tafsir content uses.
// Keeps the typographic tags we style for and the inline Arabic span,
// drops scripts, event handlers, inline styles, iframes, images, forms.
const TAFSIR_SANITIZE_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "span",
    "em",
    "i",
    "strong",
    "b",
    "sup",
    "sub",
    "blockquote",
    "a",
    "ul",
    "ol",
    "li",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "lang", "dir"],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|#)/i,
};

interface TafsirButtonProps {
  verseKey: string;
  open: boolean;
  onToggle: () => void;
}

export function TafsirButton({
  verseKey,
  open,
  onToggle,
}: TafsirButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={
        open
          ? `Hide commentary on ayah ${verseKey}`
          : `Show commentary on ayah ${verseKey}`
      }
      className={
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-xs font-medium transition-colors md:h-8 md:w-8 " +
        (open
          ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
          : "border-border text-muted-foreground hover:border-amber-500/40 hover:text-amber-400")
      }
      title={open ? "Hide commentary" : "Show commentary"}
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
        <path d="M2 3h4a2 2 0 0 1 2 2v8a1.5 1.5 0 0 0-1.5-1.5H2zM14 3h-4a2 2 0 0 0-2 2v8a1.5 1.5 0 0 1 1.5-1.5H14z" />
      </svg>
    </button>
  );
}

interface TafsirPanelProps {
  verseKey: string;
}

export function TafsirPanel({ verseKey }: TafsirPanelProps) {
  // Initial render uses the default so SSR and first client paint
  // match. A small post-mount effect then hydrates the user's saved
  // preference; if it differs, a second fetch runs. Browser caching
  // on the Qur'an.com API (cache: "force-cache" in quran-api.ts)
  // makes repeated calls cheap.
  const [tafsirId, setTafsirId] = useState<number>(DEFAULT_TAFSIR_ID);
  const [tafsir, setTafsir] = useState<Tafsir | null>(null);
  const [loading, setLoading] = useState(true);
  const quranComUrl = `https://quran.com/${verseKey.replace(":", "/")}/tafsirs`;

  const sanitisedText = useMemo(
    () => (tafsir ? DOMPurify.sanitize(tafsir.text, TAFSIR_SANITIZE_CONFIG) : ""),
    [tafsir],
  );

  useEffect(() => {
    // Hydrate the user's saved tafsir preference after first paint.
    // setState-in-effect is intentional: SSR and first client render
    // must match (both use DEFAULT_TAFSIR_ID), and the localStorage
    // read has to happen client-side only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTafsirId(loadTafsirPreference());
  }, []);

  useEffect(() => {
    // Reset loading/tafsir state when the verse or tafsir id changes
    // so the skeleton shows while the new fetch is in flight rather
    // than the previous tafsir's body staying visible.
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setTafsir(null);
    fetchTafsir(verseKey, tafsirId)
      .then((t) => {
        if (cancelled) return;
        setTafsir(t);
        setLoading(false);
      })
      .catch(() => {
        // fetchTafsir swallows errors internally and returns null, so
        // this only fires if that changes. Fall back to the "couldn't
        // be loaded" message instead of leaving a permanent skeleton.
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [verseKey, tafsirId]);

  const handleSelect = (id: number) => {
    if (id === tafsirId) return;
    setTafsirId(id);
    saveTafsirPreference(id);
  };

  return (
    <section
      aria-label={`Commentary on ayah ${verseKey}`}
      className="relative mt-4 overflow-hidden rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.04] via-card to-card shadow-sm shadow-black/10"
    >
      {/* Amber margin rail */}
      <div
        aria-hidden="true"
        className="absolute bottom-5 left-0 top-5 w-[3px] rounded-full bg-gradient-to-b from-amber-500/60 via-amber-500/40 to-amber-500/10"
      />

      <div className="px-5 py-5 md:px-8 md:py-6">
        <header className="mb-4 border-b border-border/50 pb-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-amber-500/80">
                Commentary
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                On ayah{" "}
                <span className="font-mono text-amber-400">{verseKey}</span>
              </p>
            </div>
            {tafsir?.name && !loading && (
              <p className="text-xs text-foreground/70">
                <span className="text-muted-foreground">by </span>
                {tafsir.name}
              </p>
            )}
          </div>

          {/* Tafsir picker. Intentionally NOT radio semantics: WAI-ARIA
              radiogroup requires arrow-key navigation between radios,
              and re-implementing that on non-native elements is easy to
              get subtly wrong. Treating the chips as toggle buttons with
              aria-pressed is honest and keyboard-friendly - each chip is
              individually tabbable, Enter/Space selects. */}
          <div
            role="group"
            aria-label="Choose a tafsir source"
            className="mt-3 flex flex-wrap gap-1.5"
          >
            {TAFSIR_PRESETS.map((preset) => {
              const isActive = preset.id === tafsirId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelect(preset.id)}
                  className={`inline-flex h-9 items-center rounded-full border px-3 text-[11px] font-medium transition-colors md:h-8 ${
                    isActive
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                      : "border-border text-muted-foreground hover:border-amber-500/40 hover:text-amber-400"
                  }`}
                  title={`${preset.author} · ${preset.blurb}`}
                >
                  <span>{preset.label}</span>
                  <span className="ml-1.5 hidden text-[9px] uppercase tracking-wider opacity-70 md:inline">
                    {preset.blurb.split(" · ")[1] ?? preset.blurb}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        {loading && (
          <div
            className="space-y-3"
            role="status"
            aria-label="Loading commentary"
          >
            <div className="h-4 w-11/12 animate-pulse rounded bg-muted/30" />
            <div className="h-4 w-full animate-pulse rounded bg-muted/30" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-muted/30" />
            <div className="h-4 w-9/12 animate-pulse rounded bg-muted/30" />
          </div>
        )}

        {!loading && !tafsir && (
          <p className="text-sm text-muted-foreground">
            This tafsir doesn&apos;t cover ayah {verseKey}, or couldn&apos;t be
            loaded right now. Try a different tafsir from the picker above, or{" "}
            <a
              href={quranComUrl}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 underline-offset-4 hover:underline"
            >
              read on Qur&apos;an.com ↗
            </a>
          </p>
        )}

        {!loading && tafsir && (
          <>
            <article
              lang={tafsir.language === "english" ? "en" : tafsir.language}
              className={[
                "font-serif text-[15.5px] md:text-[16.5px]",
                "leading-[1.85] tracking-[0.005em] text-foreground/90",
                "first-letter:text-[1.35em] first-letter:font-medium first-letter:text-foreground",
                "[&_p]:mb-4 [&_p:last-child]:mb-0",
                "[&_sup]:ml-[1px] [&_sup]:align-super [&_sup]:text-[0.65em]",
                "[&_sup]:font-mono [&_sup]:font-medium [&_sup]:text-amber-500/80",
                "[&_em]:text-foreground [&_i]:text-foreground",
                "[&_[dir=rtl]]:font-mono [&_[dir=rtl]]:text-[1.05em]",
                "[&_[lang=ar]]:font-mono [&_[lang=ar]]:text-[1.05em]",
                "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-amber-500/30",
                "[&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-foreground/75",
                "[&_a]:text-amber-400 [&_a]:underline-offset-4 hover:[&_a]:underline",
              ].join(" ")}
              dangerouslySetInnerHTML={{ __html: sanitisedText }}
            />

            <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-[10px]">
              <p className="font-mono uppercase tracking-[0.25em] text-muted-foreground/70">
                Source · Qur&apos;an.com tafsirs API
              </p>
              <a
                href={quranComUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono uppercase tracking-[0.2em] text-amber-500/80 underline-offset-4 hover:text-amber-400 hover:underline"
              >
                Read full ↗
              </a>
            </footer>
          </>
        )}
      </div>
    </section>
  );
}
