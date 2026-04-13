"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completeLogin } from "@/lib/auth/qf-oauth";
import { useAuth } from "@/lib/auth/auth-context";

type Status = "pending" | "success" | "error";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string>("Completing sign-in…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      setStatus("error");
      setMessage(
        params.get("error_description") ??
          `Sign-in was cancelled or failed (${error}).`
      );
      return;
    }

    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) {
      setStatus("error");
      setMessage("Missing authorisation code in callback URL.");
      return;
    }

    let cancelled = false;
    completeLogin(code, state)
      .then(({ returnTo }) => {
        if (cancelled) return;
        refresh();
        setStatus("success");
        setMessage("Signed in — redirecting…");
        const target = returnTo && returnTo.startsWith("/") ? returnTo : "/";
        setTimeout(() => router.replace(target), 400);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [refresh, router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-8 text-center">
      <div className="font-mono text-3xl font-bold text-amber-500">
        Siraj Noor
      </div>
      <div
        className="max-w-md rounded-lg border border-border bg-card px-6 py-5 text-sm text-foreground"
        role="status"
        aria-live="polite"
      >
        {status === "pending" && (
          <>
            <div className="mb-2 font-medium">Signing you in</div>
            <div className="text-muted-foreground">{message}</div>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mb-2 font-medium text-emerald-500">
              Signed in
            </div>
            <div className="text-muted-foreground">{message}</div>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mb-2 font-medium text-rose-500">
              Sign-in failed
            </div>
            <div className="mb-4 text-muted-foreground">{message}</div>
            <Link
              href="/"
              className="inline-block rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Return home
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
