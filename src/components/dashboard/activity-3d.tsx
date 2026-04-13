"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import type { ReadingSession } from "@/lib/qf-user-api";

const DAYS = 365;
const ROWS = 7;
const COLS = Math.ceil(DAYS / ROWS); // 53
const CELL_SIZE = 0.6;
const CELL_GAP = 0.12;
const MAX_HEIGHT = 4;
const SATURATE_AT = 4;

const DIM_COLOUR = new THREE.Color("#1e293b");
const READ_COLOUR = new THREE.Color("#fbbf24");
const TODAY_COLOUR = new THREE.Color("#f59e0b");

interface CellData {
  index: number;
  date: Date;
  isoDate: string;
  count: number;
  isToday: boolean;
}

function isoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function buildCells(sessions: ReadingSession[]): CellData[] {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    if (!session.created_at) continue;
    const d = new Date(session.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const key = isoDate(d);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const todayIso = isoDate(new Date());
  const cells: CellData[] = [];
  // Walk backwards from today so the most recent column is on the right.
  for (let i = DAYS - 1; i >= 0; i--) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - i);
    const key = isoDate(date);
    cells.push({
      index: DAYS - 1 - i,
      date,
      isoDate: key,
      count: counts.get(key) ?? 0,
      isToday: key === todayIso,
    });
  }
  return cells;
}

interface CellMeshProps {
  cell: CellData;
  onHover: (c: CellData | null) => void;
  hovered: boolean;
}

function CellMesh({ cell, onHover, hovered }: CellMeshProps) {
  const ref = useRef<THREE.Mesh>(null);

  const intensity = Math.min(cell.count / SATURATE_AT, 1);
  const targetHeight = 0.05 + intensity * MAX_HEIGHT;
  const baseColour = useMemo(() => {
    if (cell.count === 0) return DIM_COLOUR.clone();
    return DIM_COLOUR.clone().lerp(READ_COLOUR, intensity);
  }, [cell.count, intensity]);

  // Layout: column = floor(index / 7), row = index % 7
  const col = Math.floor(cell.index / ROWS);
  const row = cell.index % ROWS;
  const x = (col - COLS / 2) * (CELL_SIZE + CELL_GAP);
  const z = (row - ROWS / 2) * (CELL_SIZE + CELL_GAP);

  useFrame(() => {
    if (!ref.current) return;
    const targetY = hovered ? targetHeight + 0.4 : targetHeight;
    ref.current.scale.y = THREE.MathUtils.lerp(
      ref.current.scale.y,
      Math.max(targetY, 0.05),
      0.18
    );
    ref.current.position.y = ref.current.scale.y / 2;

    const mat = ref.current.material as THREE.MeshStandardMaterial;
    const targetEmissive = cell.isToday ? 1.2 : intensity > 0 ? 0.55 : 0.05;
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      hovered ? 1.4 : targetEmissive,
      0.15
    );
  });

  return (
    <mesh
      ref={ref}
      position={[x, targetHeight / 2, z]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(cell);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "auto";
      }}
    >
      <boxGeometry args={[CELL_SIZE, 1, CELL_SIZE]} />
      <meshStandardMaterial
        color={cell.isToday ? TODAY_COLOUR : baseColour}
        emissive={cell.isToday ? TODAY_COLOUR : baseColour}
        emissiveIntensity={0.35}
        roughness={0.25}
        metalness={0.6}
      />
    </mesh>
  );
}

function FloorPlate() {
  const width = COLS * (CELL_SIZE + CELL_GAP) + 1;
  const depth = ROWS * (CELL_SIZE + CELL_GAP) + 1;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial
        color="#020617"
        roughness={0.6}
        metalness={0.4}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

function Scene({
  cells,
  onHover,
  hoveredIndex,
}: {
  cells: CellData[];
  onHover: (c: CellData | null) => void;
  hoveredIndex: number | null;
}) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[8, 18, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 12, 0]} intensity={1.2} color="#f59e0b" distance={30} />
      <pointLight position={[-12, 6, -12]} intensity={0.8} color="#22d3ee" distance={30} />
      <FloorPlate />

      {cells.map((cell) => (
        <CellMesh
          key={cell.isoDate}
          cell={cell}
          onHover={onHover}
          hovered={hoveredIndex === cell.index}
        />
      ))}

      <Text
        position={[0, 0.05, ROWS * (CELL_SIZE + CELL_GAP) / 2 + 0.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.5}
        color="#64748b"
        anchorX="center"
      >
        365 days
      </Text>

      <Stars radius={60} depth={50} count={1500} factor={3} fade speed={0.3} />

      <OrbitControls
        enablePan={false}
        minDistance={10}
        maxDistance={45}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 1, 0]}
        autoRotate
        autoRotateSpeed={0.25}
        keyEvents={false}
      />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.18}
          luminanceSmoothing={0.9}
          intensity={0.6}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

interface Activity3DProps {
  sessions: ReadingSession[];
}

export function Activity3D({ sessions }: Activity3DProps) {
  const cells = useMemo(() => buildCells(sessions), [sessions]);
  const [hovered, setHovered] = useState<CellData | null>(null);

  const totals = useMemo(() => {
    const activeDays = cells.filter((c) => c.count > 0).length;
    const totalSessions = cells.reduce((sum, c) => sum + c.count, 0);
    const busiest = cells.reduce(
      (best, c) => (c.count > best.count ? c : best),
      cells[0]
    );
    return { activeDays, totalSessions, busiest };
  }, [cells]);

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-xl border border-border bg-[#050510] md:h-[560px]">
      <Canvas
        shadows
        camera={{ position: [0, 18, 20], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor("#050510");
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.25;
        }}
      >
        <Scene
          cells={cells}
          onHover={setHovered}
          hoveredIndex={hovered?.index ?? null}
        />
      </Canvas>

      {/* Hover tooltip */}
      {hovered && (
        <div className="pointer-events-none absolute left-6 bottom-6 max-w-xs rounded-lg border border-border bg-popover/95 px-4 py-3 shadow-xl backdrop-blur-sm">
          <p className="font-mono text-xs text-muted-foreground">
            {hovered.date.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {hovered.count === 0
              ? "No activity"
              : `${hovered.count} reading session${hovered.count === 1 ? "" : "s"}`}
          </p>
          {hovered.isToday && (
            <p className="mt-1 text-xs text-amber-400">Today</p>
          )}
        </div>
      )}

      {/* Totals chips */}
      <div className="pointer-events-none absolute right-6 top-6 flex flex-col items-end gap-1 text-xs text-muted-foreground/80">
        <span>
          <span className="font-mono text-foreground">{totals.activeDays}</span>{" "}
          active days
        </span>
        <span>
          <span className="font-mono text-foreground">
            {totals.totalSessions}
          </span>{" "}
          total sessions
        </span>
      </div>

      {/* Legend */}
      <div className="pointer-events-none absolute right-6 bottom-6 flex items-center gap-2 text-xs text-muted-foreground/60">
        <span>Less</span>
        <span className="inline-block h-3 w-3 rounded-sm bg-slate-800" />
        <span className="inline-block h-3 w-3 rounded-sm bg-amber-900" />
        <span className="inline-block h-3 w-3 rounded-sm bg-amber-700" />
        <span className="inline-block h-3 w-3 rounded-sm bg-amber-500" />
        <span>More</span>
      </div>
    </div>
  );
}
