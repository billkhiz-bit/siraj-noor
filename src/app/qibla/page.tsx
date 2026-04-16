"use client";

import Link from "next/link";
import { Sidebar } from "@/components/dashboard/sidebar";
import { QiblaCompass } from "@/components/dashboard/qibla-compass";

export default function QiblaPage() {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 pt-16 md:p-10">
        <header className="mb-6">
          <h1 className="font-mono text-3xl font-bold text-amber-500">
            Qibla
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The direction Muslims face in prayer: toward the Kaaba in Makkah.
          </p>
        </header>

        {/* Two-column layout on desktop: compass on the left, context on
            the right. Stacks on mobile. */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_1fr)]">
          <div>
            <QiblaCompass size="large" />
          </div>

          <aside className="space-y-5">
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/80">
                What is Qibla
              </h2>
              <p className="text-sm leading-relaxed text-foreground/85">
                Qibla is the direction every Muslim turns toward for the five
                daily prayers, the ritual of wudu, the slaughter of animals
                for halal consumption, and the burial of the deceased. It
                points to the Kaaba, the cubic sanctuary at the centre of
                the Masjid al-Haram in Makkah, Saudi Arabia.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/80">
                How this compass works
              </h2>
              <ul className="space-y-2 text-sm leading-relaxed text-foreground/85">
                <li>
                  <span className="font-medium text-foreground">
                    The bearing
                  </span>{" "}
                  is calculated using the great-circle initial bearing formula
                  from your position to the Kaaba (21.4225 N, 39.8262 E).
                  This is the angle, measured clockwise from true north, that
                  a plane would fly on a direct route.
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    The distance
                  </span>{" "}
                  uses the haversine formula on a spherical Earth. Accurate to
                  within about 0.3 percent for our purpose, which is ample.
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    On mobile
                  </span>
                  , you can opt in to device-orientation tracking: the needle
                  then stays pointing at Makkah in real-world space as you
                  rotate your phone. iOS requires an explicit tap to grant
                  orientation access.
                </li>
              </ul>
            </section>

            <section className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-5">
              <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/80">
                Historical context
              </h2>
              <p className="mb-3 text-sm leading-relaxed text-foreground/85">
                For the first sixteen months after the Hijrah, the early
                Muslim community prayed facing Jerusalem. The Qibla was
                changed to the Kaaba by divine revelation in Surah al-Baqarah:
              </p>
              <blockquote className="rounded-md border-l-2 border-amber-500/50 bg-card p-3">
                <p className="text-sm italic leading-relaxed text-foreground/80">
                  &ldquo;So turn your face toward the Sacred Mosque, and
                  wherever you are, turn your faces toward it.&rdquo;
                </p>
                <p className="mt-2 font-mono text-xs text-amber-500/80">
                  <Link
                    href="/surah/2/#verse-2:144"
                    className="underline-offset-4 hover:underline"
                  >
                    Qur&apos;an 2:144
                  </Link>
                </p>
              </blockquote>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/80">
                Explore further
              </h2>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/map"
                  className="inline-flex h-10 items-center rounded-md border border-border px-3 text-xs font-medium text-foreground transition-colors hover:border-amber-500/40 hover:text-amber-400"
                >
                  Revelation Map
                </Link>
                <Link
                  href="/sites"
                  className="inline-flex h-10 items-center rounded-md border border-border px-3 text-xs font-medium text-foreground transition-colors hover:border-amber-500/40 hover:text-amber-400"
                >
                  Sacred Sites
                </Link>
                <Link
                  href="/journeys"
                  className="inline-flex h-10 items-center rounded-md border border-border px-3 text-xs font-medium text-foreground transition-colors hover:border-amber-500/40 hover:text-amber-400"
                >
                  Islamic Journeys
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
