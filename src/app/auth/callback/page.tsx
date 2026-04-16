"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completeLogin, beginLogin } from "@/lib/auth/qf-oauth";
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
      try {
        const params = new URLSearchParams(window.location.search);
        const error = params.get("error");
        if (error) {
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
          update({
            status: "error",
            message: "Missing authorisation code in callback URL.",
          });
          return;
        }

        const { returnTo } = await completeLogin(code, stateParam);
        if (cancelled) return;
        refresh();
        update({ status: "success", message: "Signed in - redirecting…" });
        // Defence-in-depth on returnTo: startsWith("/") blocks external
        // URLs; !startsWith("//") blocks protocol-relative bypasses;
        // the whitespace/control-char check blocks /\tevil, /\u0000…
        // tricks that some routers normalise.
        const isSafeReturnTo =
          typeof returnTo === "string" &&
          returnTo.startsWith("/") &&
          !returnTo.startsWith("//") &&
          !/[\s\x00-\x1f]/.test(returnTo);
        const target = isSafeReturnTo ? returnTo : "/";
        setTimeout(() => router.replace(target), 400);
      } catch (err) {
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
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => void beginLogin("/")}
                className="inline-block rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
              >
                Try signing in again
              </button>
              <Link
                href="/"
                className="inline-block rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Return home
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
