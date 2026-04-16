"use client";

// Qibla compass — computes the great-circle initial bearing from the
// user's geolocation to the Kaaba in Makkah (21.4225°N, 39.8262°E)
// and renders an SVG compass pointing that way. Desktop users see a
// static "N-up" compass; mobile users with DeviceOrientationEvent
// support can opt in to live orientation so the arrow tracks their
// physical direction.
//
// Geolocation prompt is opt-in — no silent permission grab on mount.
// Distance shown in km alongside bearing for extra context.

import { useEffect, useState } from "react";

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;
const EARTH_RADIUS_KM = 6371;

type Status = "idle" | "locating" | "ready" | "denied" | "error";

interface UserLocation {
  lat: number;
  lng: number;
  bearing: number;
  distanceKm: number;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

function computeBearing(lat1: number, lng1: number, lat2: number, lng2: number) {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

function computeDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function QiblaCompass() {
  const [status, setStatus] = useState<Status>("idle");
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  useEffect(() => {
    if (deviceHeading === null) return;
    // No cleanup needed — listener is attached by requestOrientation()
    // handler and lives until page reload.
  }, [deviceHeading]);

  function requestLocation() {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const bearing = computeBearing(latitude, longitude, KAABA_LAT, KAABA_LNG);
        const distanceKm = computeDistance(
          latitude,
          longitude,
          KAABA_LAT,
          KAABA_LNG
        );
        setLocation({ lat: latitude, lng: longitude, bearing, distanceKm });
        setStatus("ready");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
        } else {
          setStatus("error");
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
    );
  }

  async function requestOrientation() {
    // iOS 13+ requires explicit permission via
    // DeviceOrientationEvent.requestPermission(). Other browsers
    // (Android Chrome, Safari desktop) can attach the listener
    // directly. We accept either pathway.
    const DeviceOrientationEventClass = (window as unknown as {
      DeviceOrientationEvent?: {
        requestPermission?: () => Promise<"granted" | "denied">;
      };
    }).DeviceOrientationEvent;
    if (!DeviceOrientationEventClass) return;

    if (typeof DeviceOrientationEventClass.requestPermission === "function") {
      try {
        const result = await DeviceOrientationEventClass.requestPermission();
        if (result !== "granted") return;
      } catch {
        return;
      }
    }

    function handler(e: DeviceOrientationEvent) {
      // Prefer webkitCompassHeading (iOS, absolute to true north)
      // over alpha (relative to device initial orientation). alpha
      // needs further correction to be useful; compassHeading is
      // the pragmatic choice.
      const heading =
        (e as unknown as { webkitCompassHeading?: number })
          .webkitCompassHeading ?? e.alpha;
      if (typeof heading === "number") setDeviceHeading(heading);
    }
    window.addEventListener("deviceorientation", handler, true);
  }

  // Rotate the needle opposite to the device heading so the arrow
  // stays pointing at Makkah in real-world space.
  const needleRotation =
    location && deviceHeading !== null
      ? location.bearing - deviceHeading
      : location?.bearing ?? 0;

  return (
    <section
      aria-labelledby="qibla-heading"
      className="rounded-xl border border-amber-500/20 bg-card/90 p-5 backdrop-blur-sm"
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2
            id="qibla-heading"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/80"
          >
            Qibla
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Direction to the Kaaba in Makkah
          </p>
        </div>
        {location && (
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-amber-500 tabular-nums">
              {Math.round(location.bearing)}°
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {Math.round(location.distanceKm).toLocaleString()} km
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center py-3">
        <div className="relative h-40 w-40">
          {/* Compass rose */}
          <svg
            viewBox="-50 -50 100 100"
            className="h-full w-full"
            aria-hidden={location ? "false" : "true"}
            role="img"
            aria-label={
              location
                ? `Qibla bearing ${Math.round(location.bearing)} degrees from north`
                : "Qibla compass, awaiting location"
            }
          >
            {/* Outer ring */}
            <circle
              cx="0"
              cy="0"
              r="46"
              fill="none"
              stroke="rgba(148, 163, 184, 0.3)"
              strokeWidth="0.5"
            />
            {/* Cardinal marks */}
            {[
              { angle: 0, label: "N", weight: true },
              { angle: 90, label: "E" },
              { angle: 180, label: "S" },
              { angle: 270, label: "W" },
            ].map((mark) => {
              const θ = toRad(mark.angle - 90);
              const x = Math.cos(θ) * 40;
              const y = Math.sin(θ) * 40;
              return (
                <text
                  key={mark.label}
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  fontSize="6"
                  fill={mark.weight ? "#f59e0b" : "#94a3b8"}
                  fontFamily="monospace"
                  fontWeight={mark.weight ? 700 : 500}
                >
                  {mark.label}
                </text>
              );
            })}
            {/* Minor tick marks every 15° */}
            {Array.from({ length: 24 }, (_, i) => {
              const angle = i * 15;
              const outer = 46;
              const inner = angle % 45 === 0 ? 42 : 44;
              const θ = toRad(angle - 90);
              return (
                <line
                  key={angle}
                  x1={Math.cos(θ) * inner}
                  y1={Math.sin(θ) * inner}
                  x2={Math.cos(θ) * outer}
                  y2={Math.sin(θ) * outer}
                  stroke="rgba(148, 163, 184, 0.35)"
                  strokeWidth="0.4"
                />
              );
            })}
            {/* Needle */}
            <g
              style={{
                transform: `rotate(${needleRotation}deg)`,
                transformOrigin: "0 0",
                transition: "transform 0.6s ease-out",
              }}
            >
              <path
                d="M 0 -38 L 3 0 L 0 6 L -3 0 Z"
                fill={location ? "#f59e0b" : "rgba(148, 163, 184, 0.3)"}
                stroke={location ? "#fbbf24" : "none"}
                strokeWidth="0.5"
              />
              {location && (
                <circle cx="0" cy="-42" r="2" fill="#fbbf24" opacity="0.8" />
              )}
            </g>
            {/* Centre pin */}
            <circle
              cx="0"
              cy="0"
              r="1.5"
              fill={location ? "#f59e0b" : "rgba(148, 163, 184, 0.4)"}
            />
          </svg>
        </div>
      </div>

      {status === "idle" && (
        <button
          type="button"
          onClick={requestLocation}
          className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 text-xs font-semibold uppercase tracking-wider text-amber-400 transition-colors hover:bg-amber-500/20"
        >
          Find the Qibla
        </button>
      )}
      {status === "locating" && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Locating you…
        </p>
      )}
      {status === "denied" && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Location permission denied. The compass needs your coordinates to
          compute a bearing.
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Couldn&apos;t read location. Try again from a secure (https) page.
        </p>
      )}
      {status === "ready" && deviceHeading === null && (
        <button
          type="button"
          onClick={requestOrientation}
          className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-md border border-border text-xs font-medium text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-amber-400 md:hidden"
        >
          Track device orientation (mobile)
        </button>
      )}
    </section>
  );
}
