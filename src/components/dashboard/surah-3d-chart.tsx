"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  Stars,
  ContactShadows,
  Billboard,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { surahs, type Surah } from "@/lib/data/surahs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKeyboardNav } from "@/hooks/use-keyboard-nav";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useReadingProgress } from "@/lib/auth/reading-progress-context";

type SortMode = "canonical" | "revelation" | "length";

const MECCAN_COLOUR = new THREE.Color("#22d3ee");
const MEDINAN_COLOUR = new THREE.Color("#a78bfa");
const SELECTED_COLOUR = new THREE.Color("#f59e0b");
const READ_COLOUR = new THREE.Color("#fbbf24");
const MAX_AYAT = 286;
const RING_RADIUS = 14;
const BAR_RADIUS = 0.28;
const HEIGHT_SCALE = 12;

// Notable surahs to label
const NOTABLE = new Set([1, 2, 12, 18, 36, 55, 67, 78, 96, 112, 114]);

interface SurahBarProps {
  surah: Surah;
  index: number;
  total: number;
  onHover: (surah: Surah | null) => void;
  onClick: (surah: Surah) => void;
  isHovered: boolean;
  isSelected: boolean;
  isRead: boolean;
  animate: boolean;
}

function SurahBar({
  surah,
  index,
  total,
  onHover,
  onClick,
  isHovered,
  isSelected,
  isRead,
  animate,
}: SurahBarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const readRingRef = useRef<THREE.Mesh>(null);
  const baseColour = surah.type === "meccan" ? MECCAN_COLOUR : MEDINAN_COLOUR;
  const targetHeight = (surah.ayatCount / MAX_AYAT) * HEIGHT_SCALE;
  const heightRef = useRef(0);
  const active = isHovered || isSelected;

  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const x = Math.cos(angle) * RING_RADIUS;
  const z = Math.sin(angle) * RING_RADIUS;

  useFrame((state) => {
    if (!meshRef.current) return;

    // Animated grow-in
    if (animate) {
      heightRef.current = THREE.MathUtils.lerp(
        heightRef.current,
        targetHeight,
        0.04 + index * 0.0003
      );
    } else {
      heightRef.current = targetHeight;
    }

    const h = heightRef.current;
    meshRef.current.scale.y = Math.max(h, 0.01);
    meshRef.current.position.y = h / 2;

    // Material animation
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const baseEmissive = isRead ? 0.65 : 0.35;
    const targetEmissive = active ? 0.95 : baseEmissive;
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      targetEmissive,
      0.12
    );

    if (isSelected) {
      mat.emissive.lerp(SELECTED_COLOUR, 0.1);
      mat.color.lerp(SELECTED_COLOUR, 0.1);
    } else if (isRead) {
      mat.emissive.lerp(READ_COLOUR, 0.08);
      mat.color.lerp(baseColour, 0.05);
    } else {
      mat.emissive.lerp(baseColour, 0.1);
      mat.color.lerp(baseColour, 0.1);
    }

    // Scale pulse
    const targetScale = active ? 1.25 : 1;
    meshRef.current.scale.x = THREE.MathUtils.lerp(
      meshRef.current.scale.x,
      targetScale,
      0.1
    );
    meshRef.current.scale.z = THREE.MathUtils.lerp(
      meshRef.current.scale.z,
      targetScale,
      0.1
    );

    // Gentle float for selected
    if (isSelected) {
      const t = state.clock.elapsedTime;
      meshRef.current.position.y = h / 2 + Math.sin(t * 2) * 0.1;
    }

    // Pulse the read-marker ring on a staggered phase so the ring does not
    // flash uniformly across all 114 read surahs at once.
    if (readRingRef.current && isRead) {
      const t = state.clock.elapsedTime;
      const phase = index * 0.18;
      const pulse = 0.55 + Math.sin(t * 1.6 + phase) * 0.25;
      const ringMat = readRingRef.current.material as THREE.MeshBasicMaterial;
      ringMat.opacity = pulse;
    }
  });

  return (
    <group position={[x, 0, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover(surah);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(surah);
        }}
        castShadow
      >
        <cylinderGeometry args={[BAR_RADIUS, BAR_RADIUS * 1.1, 1, 12]} />
        <meshStandardMaterial
          color={baseColour}
          emissive={baseColour}
          emissiveIntensity={0.35}
          roughness={0.15}
          metalness={0.7}
          transparent
          opacity={active ? 1 : 0.88}
        />
      </mesh>

      {/* Read marker: a glowing amber ring at the base that pulses gently */}
      {isRead && (
        <mesh
          ref={readRingRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 0]}
        >
          <ringGeometry
            args={[BAR_RADIUS * 1.6, BAR_RADIUS * 2.6, 32]}
          />
          <meshBasicMaterial
            color={READ_COLOUR}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Label for notable surahs or selected */}
      {(NOTABLE.has(surah.number) || active) && (
        <Text
          position={[0, targetHeight + 0.6, 0]}
          fontSize={active ? 0.45 : 0.3}
          color={active ? "#ffffff" : "#64748b"}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={active ? 0.02 : 0}
          outlineColor="#000000"
        >
          {surah.nameEnglish}
        </Text>
      )}
    </group>
  );
}

function FloorRing() {
  return (
    <>
      {/* Outer ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <ringGeometry args={[RING_RADIUS - 2, RING_RADIUS + 2, 128]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.4}
          metalness={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Inner disc */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.03, 0]}
      >
        <circleGeometry args={[RING_RADIUS - 2, 64]} />
        <meshStandardMaterial
          color="#020617"
          roughness={0.5}
          metalness={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>
    </>
  );
}

function CentreText() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={1.2} color="#f59e0b" anchorX="center" anchorY="middle" letterSpacing={0.15}>
          SIRAJ
        </Text>
        <Text
          position={[0, -1, 0]}
          fontSize={0.3}
          color="#64748b"
          anchorX="center"
          anchorY="middle"
        >
          114 surahs · 6,236 ayat
        </Text>
      </Billboard>
    </group>
  );
}

function Scene({
  sortedData,
  hoveredSurah,
  selectedIndex,
  readSurahs,
  onHover,
  onClick,
  controlsRef,
}: {
  sortedData: Surah[];
  hoveredSurah: Surah | null;
  selectedIndex: number;
  readSurahs: Set<number>;
  onHover: (s: Surah | null) => void;
  onClick: (s: Surah) => void;
  controlsRef: React.RefObject<{ zoomIn: () => void; zoomOut: () => void } | null>;
}) {
  const orbitRef = useRef<never>(null);
  const reducedMotion = useReducedMotion();

  // Expose zoom controls to parent once. Previously the ref-assignment
  // happened on every useFrame tick, re-allocating the { zoomIn, zoomOut }
  // object + two closures ~60 times per second. The inner closures read
  // orbitRef.current lazily so assigning once at mount is sufficient.
  useEffect(() => {
    controlsRef.current = {
      zoomIn: () => {
        const ctrl = orbitRef.current as unknown as { dollyIn: (s: number) => void; update: () => void } | null;
        if (ctrl?.dollyIn) {
          ctrl.dollyIn(1.1);
          ctrl.update();
        }
      },
      zoomOut: () => {
        const ctrl = orbitRef.current as unknown as { dollyOut: (s: number) => void; update: () => void } | null;
        if (ctrl?.dollyOut) {
          ctrl.dollyOut(1.1);
          ctrl.update();
        }
      },
    };
    return () => {
      controlsRef.current = null;
    };
  }, [controlsRef]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 25, 10]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, 20, -10]} intensity={1.2} />
      <pointLight position={[0, 20, 0]} intensity={2} color="#8b5cf6" distance={50} />
      <pointLight position={[-15, 8, -15]} intensity={1} color="#22d3ee" distance={40} />
      <pointLight position={[15, 8, 15]} intensity={1} color="#a78bfa" distance={40} />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#f59e0b" distance={20} />

      <FloorRing />
      <CentreText />

      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.4}
        scale={40}
        blur={2}
        far={20}
      />

      {sortedData.map((surah, i) => (
        <SurahBar
          key={surah.number}
          surah={surah}
          index={i}
          total={sortedData.length}
          onHover={onHover}
          onClick={onClick}
          isHovered={hoveredSurah?.number === surah.number}
          isSelected={i === selectedIndex}
          isRead={readSurahs.has(surah.number)}
          animate={true}
        />
      ))}

      <Stars radius={60} depth={50} count={1200} factor={4} fade speed={0.4} />

      <OrbitControls
        ref={orbitRef}
        enablePan={false}
        minDistance={8}
        maxDistance={40}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.3}
        target={[0, 3, 0]}
        keyEvents={false}
      />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          intensity={0.7}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export function Surah3DChart() {
  const router = useRouter();
  const [sortMode, setSortMode] = useState<SortMode>("canonical");
  const [hoveredSurah, setHoveredSurah] = useState<Surah | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const controlsRef = useRef<{ zoomIn: () => void; zoomOut: () => void } | null>(null);
  const { readSurahs } = useReadingProgress();

  const sortedData = useMemo(() => {
    const data = [...surahs];
    switch (sortMode) {
      case "revelation":
        return data.sort((a, b) => a.revelationOrder - b.revelationOrder);
      case "length":
        return data.sort((a, b) => b.ayatCount - a.ayatCount);
      default:
        return data.sort((a, b) => a.number - b.number);
    }
  }, [sortMode]);

  const handleClick = useCallback(
    (surah: Surah) => router.push(`/surah/${surah.number}`),
    [router]
  );

  useKeyboardNav({
    items: sortedData,
    selectedIndex,
    onSelect: (index) => {
      setSelectedIndex(index);
      setHoveredSurah(sortedData[index]);
    },
    onConfirm: (surah) => router.push(`/surah/${surah.number}`),
    onEscape: () => {
      setSelectedIndex(-1);
      setHoveredSurah(null);
    },
    onZoomIn: () => controlsRef.current?.zoomIn(),
    onZoomOut: () => controlsRef.current?.zoomOut(),
  });

  const displaySurah = selectedIndex >= 0 ? sortedData[selectedIndex] : hoveredSurah;

  return (
    <div className="flex flex-col gap-4">
      {/* Controls row */}
      <div className="flex items-center justify-between">
        <Tabs value={sortMode} onValueChange={(v) => { setSortMode(v as SortMode); setSelectedIndex(-1); }}>
          <TabsList>
            <TabsTrigger value="canonical">Canonical</TabsTrigger>
            <TabsTrigger value="revelation">Revelation</TabsTrigger>
            <TabsTrigger value="length">By Length</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-cyan-400" />
            Meccan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-violet-400" />
            Medinan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
            Selected
          </span>
          {readSurahs.size > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-amber-400/60" />
              Read ({readSurahs.size})
            </span>
          )}
        </div>
      </div>

      {/* 3D Canvas */}
      <div
        className="relative h-[350px] w-full overflow-hidden rounded-xl border border-border bg-[#050510] md:h-[560px]"
        role="img"
        aria-label="Interactive 3D cylindrical ring of the 114 surahs of the Qur'an. Colour-coded by revelation type: cyan for Meccan, violet for Medinan. Surahs already read pulse with an amber ring. Use arrow keys or click to select."
      >
        <Canvas
          shadows
          camera={{ position: [0, 14, 22], fov: 42 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor("#050510");
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.3;
          }}
        >
          <Scene
            sortedData={sortedData}
            hoveredSurah={hoveredSurah}
            selectedIndex={selectedIndex}
            readSurahs={readSurahs}
            onHover={setHoveredSurah}
            onClick={handleClick}
            controlsRef={controlsRef}
          />
        </Canvas>

        {/* Hover/selection tooltip */}
        {displaySurah && (
          <div className="pointer-events-auto absolute left-6 bottom-6 max-h-[45%] max-w-sm overflow-y-auto rounded-lg border border-border bg-popover/95 px-5 py-4 shadow-xl backdrop-blur-sm">
            <p className="font-mono text-xl font-bold text-foreground">
              {displaySurah.nameArabic}
            </p>
            <p className="text-sm font-medium text-foreground">
              {displaySurah.number}. {displaySurah.nameEnglish}
            </p>
            <p className="text-xs text-muted-foreground">
              &ldquo;{displaySurah.meaning}&rdquo;
            </p>
            <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
              <span
                className="font-medium"
                style={{
                  color:
                    displaySurah.type === "meccan" ? "#22d3ee" : "#a78bfa",
                }}
              >
                {displaySurah.type === "meccan" ? "Meccan" : "Medinan"}
              </span>
              <span>{displaySurah.ayatCount} ayat</span>
              <span>Revealed #{displaySurah.revelationOrder}</span>
              <span>Juz {displaySurah.juz.join(", ")}</span>
            </div>
            {selectedIndex >= 0 && (
              <p className="mt-2 text-xs text-amber-500/80">
                Press Enter to explore · Esc to deselect
              </p>
            )}
          </div>
        )}

        {/* Keyboard hints */}
        <div className="pointer-events-none absolute right-6 bottom-6 space-y-1 text-right text-xs text-muted-foreground/60">
          <p>← → Navigate surahs</p>
          <p>↑ ↓ Zoom · Enter to explore</p>
          <p>Drag to orbit · Scroll to zoom</p>
        </div>

        {/* Selected surah counter */}
        {selectedIndex >= 0 && (
          <div className="pointer-events-none absolute right-6 top-6 font-mono text-xs text-muted-foreground/60">
            {selectedIndex + 1} / {sortedData.length}
          </div>
        )}
      </div>
    </div>
  );
}
