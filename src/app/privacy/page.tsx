import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Siraj Noor",
  description:
    "How Siraj Noor handles your data, what is stored locally, and what is stored on your Quran Foundation account.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.2em] text-amber-500/80 transition-colors hover:text-amber-400"
        >
          ← Siraj Noor
        </Link>

        <h1 className="mt-6 font-mono text-3xl font-bold text-amber-500">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: 14 April 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="mb-2 font-mono text-base font-semibold text-foreground">
              Who we are
            </h2>
            <p>
              Siraj Noor is an open-source (MIT-licensed), non-commercial
              3D Qur&apos;an and Hadith companion built by a single developer
              for the Quran Foundation Hackathon 2026. It runs entirely in
              your browser as a static site - there is no Siraj Noor backend
              that receives your data.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-base font-semibold text-foreground">
              What we store in your browser
            </h2>
            <p>
              When you sign in with your Quran.com account, we store the
              following in <code className="font-mono text-amber-400">localStorage</code> on
              your device only:
            </p>
            <ul className="mt-2 ml-5 list-disc space-y-1 text-foreground/80">
              <li>Your OAuth 2.0 access and refresh tokens from Quran Foundation</li>
              <li>A temporary PKCE verifier and state value during the sign-in redirect</li>
              <li>Your preferred sort order for the Surah Ring (a UI preference)</li>
            </ul>
            <p className="mt-2">
              These values never leave your device. Signing out clears them
              immediately. We do not use cookies and we do not run any
              analytics, tracking pixels, or advertising scripts.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-base font-semibold text-foreground">
              What is stored on your Quran Foundation account
            </h2>
            <p>
              Any personal feature you use - bookmarks, collections, reading
              sessions, streaks, and reflections - is sent directly from your
              browser to the Quran Foundation User API at{" "}
              <code className="font-mono text-amber-400">
                apis.quran.foundation
              </code>
              . This data lives on your Quran Foundation account, governed by
              Quran Foundation&apos;s own privacy policy. Siraj Noor never
              receives, stores, or forwards this data.
            </p>
            <p className="mt-2">
              To delete this data, revoke Siraj Noor&apos;s access from your
              Quran.com account settings or use the Quran Foundation account
              deletion flow - that action removes everything Siraj Noor can
              see about you.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-base font-semibold text-foreground">
              Third parties your browser talks to
            </h2>
            <ul className="ml-5 list-disc space-y-1 text-foreground/80">
              <li>
                <strong>Quran.com API</strong> (
                <code className="font-mono text-amber-400">api.quran.com</code>
                ) - public, keyless content: verse text, translations,
                transliteration. No authentication, no cookies.
              </li>
              <li>
                <strong>Quran Foundation OAuth</strong> (
                <code className="font-mono text-amber-400">
                  oauth2.quran.foundation
                </code>
                ) - sign-in and token refresh.
              </li>
              <li>
                <strong>Quran Foundation User API</strong> (
                <code className="font-mono text-amber-400">
                  apis.quran.foundation
                </code>
                ) - your personal data, as described above.
              </li>
              <li>
                <strong>Hadith API</strong> (fawazahmed0/hadith-api via
                jsDelivr CDN) - public hadith text. No authentication.
              </li>
              <li>
                <strong>CARTO</strong> - dark-themed map tiles for the
                Revelation Map view. No authentication.
              </li>
              <li>
                <strong>Cloudflare Pages</strong> - static hosting. Cloudflare
                may log standard HTTP request metadata (IP, user agent, timestamp)
                for abuse prevention, per their own privacy policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-base font-semibold text-foreground">
              Children
            </h2>
            <p>
              Siraj Noor is not directed at children under 13. We do not
              knowingly process any personal data from children. Parents who
              believe a child has signed in should revoke Quran Foundation
              access from that account.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-base font-semibold text-foreground">
              Contact
            </h2>
            <p>
              Questions, concerns, or corrections: open an issue at{" "}
              <a
                href="https://github.com/billkhiz-bit/siraj-noor/issues"
                className="text-amber-400 underline-offset-4 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/billkhiz-bit/siraj-noor/issues
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6 text-xs text-muted-foreground">
          <Link
            href="/terms"
            className="transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
          <span className="font-mono">Siraj Noor · سراج نور</span>
        </div>
      </main>
    </div>
  );
}
