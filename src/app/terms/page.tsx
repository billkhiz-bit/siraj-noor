import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Siraj Noor",
  description:
    "Terms governing your use of Siraj Noor, a non-commercial open-source Qur'an and Hadith companion.",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: 14 April 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="mb-2 font-mono text-base font-semibold text-foreground">
              1. The software
            </h2>
            <p>
              Siraj Noor is a free, open-source, non-commercial Qur&apos;an
              and Hadith visualisation built for the Quran Foundation
              Hackathon 2026. Source code is available at{" "}
              <a
                href="https://github.com/billkhiz-bit/siraj-noor"
                className="text-amber-400 underline-offset-4 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/billkhiz-bit/siraj-noor
              </a>{" "}
              under the MIT Licence. By using the hosted version at{" "}
              <code className="font-mono text-amber-400">
                siraj-noor.pages.dev
              </code>{" "}
              you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-base font-semibold text-foreground">
              2. Your Quran Foundation account
            </h2>
            <p>
              Personal features (bookmarks, collections, reading sessions,
              reflections) require signing in with a Quran Foundation account.
              Your use of that account is governed by Quran Foundation&apos;s
              own terms of service and privacy policy. Siraj Noor acts only as
              a client - we never receive or store your credentials, only the
              OAuth tokens your browser uses to talk to Quran Foundation
              directly.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-base font-semibold text-foreground">
              3. Content accuracy
            </h2>
            <p>
              Qur&apos;anic text is served from the Quran.com Content API
              (Al-Azhar Egyptian Standard). Translations are Sahih
              International. Hadith data comes from the fawazahmed0 hadith
              dataset covering six canonical collections. Historical
              annotations are compiled from classical sources including Ibn
              Hisham, al-Tabari, and Martin Lings. We make every effort to
              present this content faithfully, but Siraj Noor is a visualisation
              tool and is not a substitute for direct study of the Qur&apos;an
              and Sunnah with qualified teachers.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-base font-semibold text-foreground">
              4. Acceptable use
            </h2>
            <p>You agree not to:</p>
            <ul className="mt-2 ml-5 list-disc space-y-1 text-foreground/80">
              <li>
                Use Siraj Noor to harass, deceive, or defame any individual or
                group
              </li>
              <li>
                Attempt to extract, scrape, or redistribute the underlying
                Quran Foundation or Quran.com APIs beyond their own terms
              </li>
              <li>
                Submit reflections or notes that are unlawful, defamatory, or
                otherwise violate Quran Foundation&apos;s content policies
              </li>
              <li>
                Use the software to misrepresent the Qur&apos;an, the Hadith,
                or the lives of the Prophets, peace be upon them
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-base font-semibold text-foreground">
              5. No warranty
            </h2>
            <p>
              Siraj Noor is provided <em>as is</em>, without warranty of any
              kind, express or implied. The author is not liable for any loss
              or damage arising from use of the software, including any
              inaccuracy in displayed scripture or historical information. You
              use it at your own discretion.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-base font-semibold text-foreground">
              6. Changes
            </h2>
            <p>
              We may update these terms as the project evolves. The current
              version is always the one on this page, versioned alongside the
              source code in git history.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-base font-semibold text-foreground">
              7. Contact
            </h2>
            <p>
              Open an issue at{" "}
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
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <span className="font-mono">Siraj Noor · سراج نور</span>
        </div>
      </main>
    </div>
  );
}
