"use client";

// Qibla compass. Computes the great-circle initial bearing from the
// user's geolocation to the Kaaba in Makkah (21.4225 N, 39.8262 E)
// and renders an SVG compass pointing that way. Desktop users see a
// static "N-up" compass; mobile users with DeviceOrientationEvent
// support can opt in to live orientation so the arrow tracks their
// physical direction.
//
// Geolocation is opt-in (no silent permission grab on mount). If
// a user has denied permission, they can still pick a city from a
// preset list and get an accurate bearing without re-enabling the
// geolocation API at the browser level.

import { useEffect, useMemo, useState } from "react";

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;
const EARTH_RADIUS_KM = 6371;

interface LocationState {
  label: string;
  lat: number;
  lng: number;
  bearing: number;
  distanceKm: number;
  source: "geolocation" | "manual";
}

interface PresetCity {
  label: string;
  lat: number;
  lng: number;
}

// A small set of major cities for users who can't or won't share
// their location. Coverage is deliberately global: Mecca itself,
// regional capitals in the Muslim world, plus the cities where
// most app users are likely to live.
const PRESET_CITIES: PresetCity[] = [
  { label: "Makkah", lat: 21.4225, lng: 39.8262 },
  { label: "Madinah", lat: 24.5247, lng: 39.5692 },
  { label: "Istanbul", lat: 41.0082, lng: 28.9784 },
  { label: "Cairo", lat: 30.0444, lng: 31.2357 },
  { label: "Riyadh", lat: 24.7136, lng: 46.6753 },
  { label: "Dubai", lat: 25.2048, lng: 55.2708 },
  { label: "Karachi", lat: 24.8607, lng: 67.0011 },
  { label: "Lahore", lat: 31.5204, lng: 74.3587 },
  { label: "Jakarta", lat: -6.2088, lng: 106.8456 },
  { label: "Kuala Lumpur", lat: 3.139, lng: 101.6869 },
  { label: "London", lat: 51.5074, lng: -0.1278 },
  { label: "New York", lat: 40.7128, lng: -74.006 },
  { label: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { label: "Toronto", lat: 43.6532, lng: -79.3832 },
  { label: "Sydney", lat: -33.8688, lng: 151.2093 },
  { label: "Paris", lat: 48.8566, lng: 2.3522 },
  { label: "Berlin", lat: 52.52, lng: 13.405 },
  { label: "Johannesburg", lat: -26.2041, lng: 28.0473 },
];

type Status = "idle" | "locating" | "ready" | "denied" | "error";

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

function computeBearing(lat1: number, lng1: number, lat2: number, lng2: number) {
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const dL = toRad(lng2 - lng1);
  const y = Math.sin(dL) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dL);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function computeDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const dP = toRad(lat2 - lat1);
  const dL = toRad(lng2 - lng1);
  const a = Math.sin(dP / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dL / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function buildLocation(
  label: string,
  lat: number,
  lng: number,
  source: LocationState["source"]
): LocationState {
  return {
    label,
    lat,
    lng,
    bearing: computeBearing(lat, lng, KAABA_LAT, KAABA_LNG),
    distanceKm: computeDistance(lat, lng, KAABA_LAT, KAABA_LNG),
    source,
  };
}

interface QiblaCompassProps {
  size?: "compact" | "large";
}

export function QiblaCompass({ size = "compact" }: QiblaCompassProps = {}) {
  const [status, setStatus] = useState<Status>("idle");
  const [location, setLocation] = useState<LocationState | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [orientationEnabled, setOrientationEnabled] = useState(false);

  const compassDiameter = size === "large" ? 280 : 160;

  // Query permission state once so we can show a friendlier "denied"
  // hint on the idle screen without forcing a click.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) return;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((result) => {
        if (result.state === "denied") setStatus("denied");
      })
      .catch(() => {
        /* Permissions API not supported, leave idle */
      });
  }, []);

  function requestLocation() {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(
          buildLocation("Your location", latitude, longitude, "geolocation")
        );
        setStatus("ready");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus("denied");
        else setStatus("error");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
    );
  }

  function pickCity(city: PresetCity) {
    setLocation(buildLocation(city.label, city.lat, city.lng, "manual"));
    setStatus("ready");
  }

  async function requestOrientation() {
    const DeviceOrientationEventClass = (
      window as unknown as {
        DeviceOrientationEvent?: {
          requestPermission?: () => Promise<"granted" | "denied">;
        };
      }
    ).DeviceOrientationEvent;
    if (!DeviceOrientationEventClass) return;

    if (typeof DeviceOrientationEventClass.requestPermission === "function") {
      try {
        const result = await DeviceOrientationEventClass.requestPermission();
        if (result !== "granted") return;
      } catch {
        return;
      }
    }

    setOrientationEnabled(true);
  }

  // Attach the deviceorientation listener only while live orientation is
  // enabled. The useEffect-with-cleanup shape means we never leak a
  // handler when the component unmounts or the user switches back to
  // the static N-up view.
  useEffect(() => {
    if (!orientationEnabled) return;
    if (typeof window === "undefined") return;

    function handler(e: DeviceOrientationEvent) {
      const heading =
        (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading ??
        e.alpha;
      if (typeof heading === "number") setDeviceHeading(heading);
    }

    window.addEventListener("deviceorientation", handler, true);
    return () => {
      window.removeEventListener("deviceorientation", handler, true);
    };
  }, [orientationEnabled]);

  const needleRotation = useMemo(() => {
    if (!location) return 0;
    if (deviceHeading === null) return location.bearing;
    return location.bearing - deviceHeading;
  }, [location, deviceHeading]);

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

      {location && (
        <p className="mb-3 text-xs text-muted-foreground">
          From{" "}
          <span className="font-medium text-foreground">{location.label}</span>
          {location.source === "manual" ? " (manual)" : ""}
          {" · "}
          {location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°
        </p>
      )}

      <div className="flex items-center justify-center py-3">
        <div
          className="relative"
          style={{ width: compassDiameter, height: compassDiameter }}
        >
          <svg
            viewBox="-50 -50 100 100"
            className="h-full w-full"
            role="img"
            aria-label={
              location
                ? `Qibla bearing ${Math.round(location.bearing)} degrees from north`
                : "Qibla compass, awaiting location"
            }
          >
            <circle
              cx="0"
              cy="0"
              r="46"
              fill="none"
              stroke="rgba(148, 163, 184, 0.3)"
              strokeWidth="0.5"
            />
            {[
              { angle: 0, label: "N", weight: true },
              { angle: 90, label: "E" },
              { angle: 180, label: "S" },
              { angle: 270, label: "W" },
            ].map((mark) => {
              const t = toRad(mark.angle - 90);
              const x = Math.cos(t) * 40;
              const y = Math.sin(t) * 40;
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
            {Array.from({ length: 24 }, (_, i) => {
              const angle = i * 15;
              const outer = 46;
              const inner = angle % 45 === 0 ? 42 : 44;
              const t = toRad(angle - 90);
              return (
                <line
                  key={angle}
                  x1={Math.cos(t) * inner}
                  y1={Math.sin(t) * inner}
                  x2={Math.cos(t) * outer}
                  y2={Math.sin(t) * outer}
                  stroke="rgba(148, 163, 184, 0.35)"
                  strokeWidth="0.4"
                />
              );
            })}
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
            <circle
              cx="0"
              cy="0"
              r="1.5"
              fill={location ? "#f59e0b" : "rgba(148, 163, 184, 0.4)"}
            />
          </svg>
        </div>
      </div>

      {/* Primary action / status row */}
      {status === "idle" && (
        <button
          type="button"
          onClick={requestLocation}
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 text-xs font-semibold uppercase tracking-wider text-amber-400 transition-colors hover:bg-amber-500/20 md:h-10"
        >
          Use my location
        </button>
      )}
      {status === "locating" && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Locating you...
        </p>
      )}
      {status === "error" && (
        <div className="mt-2 rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-center text-xs text-muted-foreground">
          Couldn&apos;t read location. Try again, or pick a city below.
          <button
            type="button"
            onClick={requestLocation}
            className="ml-2 font-semibold text-amber-400 underline-offset-4 hover:underline"
          >
            Retry
          </button>
        </div>
      )}
      {status === "denied" && (
        <div className="mt-2 rounded-md border border-amber-500/25 bg-amber-500/[0.04] p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">
            Location access is off for this site.
          </p>
          <p>
            To use your actual location, click the lock icon in your browser&apos;s
            address bar, allow location, then{" "}
            <button
              type="button"
              onClick={requestLocation}
              className="font-semibold text-amber-400 underline-offset-4 hover:underline"
            >
              try again
            </button>
            . Or pick a city below for an accurate bearing right now.
          </p>
        </div>
      )}

      {/* Mobile orientation opt-in */}
      {status === "ready" &&
        location?.source === "geolocation" &&
        !orientationEnabled && (
          <button
            type="button"
            onClick={requestOrientation}
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-md border border-border text-xs font-medium text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-amber-400 md:hidden md:h-9"
          >
            Track device orientation
          </button>
        )}

      {/* City picker fallback, always available */}
      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Or pick a city
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_CITIES.map((city) => {
            const isActive = location?.label === city.label;
            return (
              <button
                key={city.label}
                type="button"
                onClick={() => pickCity(city)}
                aria-pressed={isActive}
                className={`inline-flex h-8 items-center rounded-full border px-3 text-xs transition-colors ${
                  isActive
                    ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                    : "border-border text-muted-foreground hover:border-amber-500/40 hover:text-amber-400"
                }`}
              >
                {city.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
