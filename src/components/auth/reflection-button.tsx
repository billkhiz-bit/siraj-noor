"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { qfApi, QfApiError } from "@/lib/qf-user-api";
import { cn } from "@/lib/utils";

interface ReflectionButtonProps {
  verseKey: string;
  size?: "sm" | "md";
}

type Status = "idle" | "saving" | "success" | "error";

export function ReflectionButton({ verseKey, size = "md" }: ReflectionButtonProps) {
  const { isAuthenticated, isConfigured, login } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dimensions =
    size === "sm" ? "h-11 w-11 md:h-7 md:w-7" : "h-11 w-11 md:h-8 md:w-8";

  const [chapterRaw, verseRaw] = verseKey.split(":");
  const accessibleVerseLabel =
    chapterRaw && verseRaw
      ? `surah ${chapterRaw}, ayah ${verseRaw}`
      : verseKey;

  if (!isConfigured) return null;

  function handleTriggerClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!isAuthenticated) {
      event.preventDefault();
      void login(window.location.pathname);
    }
  }

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setStatus("saving");
    setErrorMessage(null);
    try {
      await qfApi.createReflection(verseKey, trimmed);
      setStatus("success");
      setText("");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 900);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof QfApiError ? err.message : "Failed to save reflection"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            onClick={handleTriggerClick}
            aria-label={`Reflect on ${accessibleVerseLabel}`}
            title="Add a reflection"
            className={cn(
              "flex shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-amber-400",
              dimensions
            )}
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
              <path d="M2 3h12v8H6l-4 3z" />
            </svg>
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reflect on {accessibleVerseLabel}</DialogTitle>
          <DialogDescription>
            Capture a thought, dua, or insight. Reflections are saved to your
            Quran.com account and visible only to you unless you choose to
            share them.
          </DialogDescription>
        </DialogHeader>

        <textarea
          id="reflection-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did this ayah bring to mind?"
          rows={5}
          className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm leading-relaxed text-foreground focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
          maxLength={2000}
          aria-label={`Reflection on ${accessibleVerseLabel}`}
          aria-describedby="reflection-counter reflection-status"
        />

        <div
          className="flex items-center justify-between text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <span id="reflection-counter">{text.trim().length} / 2000</span>
          <span id="reflection-status">
            {status === "saving" && "Saving…"}
            {status === "success" && (
              <span className="text-emerald-400">Saved</span>
            )}
            {status === "error" && errorMessage && (
              <span className="text-rose-400">{errorMessage}</span>
            )}
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={status === "saving"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || status === "saving"}
            className="bg-amber-500 text-black hover:bg-amber-400"
          >
            {status === "saving" ? "Saving…" : "Save reflection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
