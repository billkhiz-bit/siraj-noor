"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completeLogin } from "@/lib/auth/qf-oauth";
import { useAuth } from "@/lib/auth/auth-context";

type Status = "pending" | "success" | "error";
interface CallbackState {
  status: Status;
  message: string;
}

const INITIAL: CallbackState = {
  status: "pending",
  message: "Completing sign-in…",
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [{ status, message }, setState] = useState<CallbackState>(INITIAL);

  useEffect(() => {
    let cancelled = false;

    function update(next: CallbackState) {
      if (!cancelled) setState(next);
    }

    async function run() {
      console.log("[auth/callback] run() started");
      try {
        const params = new URLSearchParams(window.location.search);
        console.log("[auth/callback] params parsed", {
          hasCode: params.has("code"),
          hasState: params.has("state"),
          hasError: params.has("error"),
        });

        const error = params.get("error");
        if (error) {
          console.log("[auth/callback] error param present:", error);
          update({
            status: "error",
            message:
              params.get("error_description") ??
              `Sign-in was cancelled or failed (${error}).`,
          });
          return;
        }

        const code = params.get("code");
        const stateParam = params.get("state");
        if (!code || !stateParam) {
          console.log("[auth/callback] missing code or state");
          update({
            status: "error",
            message: "Missing authorisation code in callback URL.",
          });
          return;
        }

        console.log("[auth/callback] calling completeLogin");
        const { returnTo } = await completeLogin(code, stateParam);
        console.log("[auth/callback] completeLogin resolved", { returnTo });
        if (cancelled) return;
        refresh();
        update({ status: "success", message: "Signed in — redirecting…" });
        const isSafeReturnTo =
          typeof returnTo === "string" &&
          returnTo.startsWith("/") &&
          !returnTo.startsWith("//");
        const target = isSafeReturnTo ? returnTo : "/";
        setTimeout(() => router.replace(target), 400);
      } catch (err) {
        console.error("[auth/callback] run() caught:", err);
        update({
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    void run();

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
