import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { RouletteWheel } from "@/components/organisms/RouletteWheel";
import { ResultModal } from "@/components/molecules/ResultModal";
import {
  PATTERNS,
  PATTERN_COUNT,
  CATEGORY_LABEL,
} from "@/domain/designPatterns";
import { randomInt, randomFloat } from "@/crypto/random";

const SLOT_ANGLE = 360 / PATTERN_COUNT;
const BASE_ROTATIONS = 5;
const SPIN_DURATION_MS = 5500;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export default function Ruleta() {
  const reduced = useReducedMotion();
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const pendingIndexRef = useRef<number | null>(null);

  function handleSpin() {
    if (isSpinning) return;
    const target = randomInt(0, PATTERN_COUNT - 1);
    pendingIndexRef.current = target;

    // Tiny jitter so the wheel doesn't land dead-center every time.
    const jitter = randomFloat(-SLOT_ANGLE / 3, SLOT_ANGLE / 3);
    // Rotation so that slot `target` ends at 12 o'clock.
    const currentMod = rotation % 360;
    const normalizedTarget =
      ((-target * SLOT_ANGLE + jitter - currentMod) % 360 + 360) % 360;
    const delta = BASE_ROTATIONS * 360 + normalizedTarget;

    setShowResult(false);
    setIsSpinning(true);
    setRotation((r) => r + delta);

    // With reduced motion, there is no transitionend — advance immediately.
    if (reduced) {
      setTimeout(() => completeSpin(target), 0);
    }
  }

  function completeSpin(target: number) {
    setCurrentIndex(target);
    setIsSpinning(false);
    setShowResult(true);
    pendingIndexRef.current = null;
  }

  const currentPattern = useMemo(
    () => (currentIndex == null ? null : PATTERNS[currentIndex] ?? null),
    [currentIndex],
  );

  const wheelAriaLabel = isSpinning
    ? "Ruleta girando"
    : currentPattern
      ? `Resultado: ${currentPattern.name}, ${CATEGORY_LABEL[currentPattern.category]}`
      : "Ruleta en reposo, toca el centro para girar";

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2.5rem",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <Link
          to="/juegos"
          aria-label="Volver"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.5rem",
            height: "2.5rem",
            flexShrink: 0,
            borderRadius: "9999px",
            border: "1px solid rgba(212, 175, 55, 0.4)",
            color: "rgba(245, 230, 202, 0.8)",
            fontSize: "1.125rem",
            textDecoration: "none",
          }}
        >
          ←
        </Link>
        <div style={{ flex: 1, textAlign: "center" }}>
          <h1 className="gold-shine font-display text-3xl leading-none md:text-4xl">
            Ruleta de Patrones
          </h1>
          <p className="mt-1 font-label text-xs text-[--color-cream]/70 md:text-sm">
            Toca el centro para girar
          </p>
        </div>
        <span aria-hidden style={{ width: "2.5rem", height: "2.5rem", flexShrink: 0 }} />
      </header>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 12rem)",
          gap: "2rem",
        }}
      >
        <RouletteWheel
          rotation={rotation}
          instant={reduced}
          durationMs={SPIN_DURATION_MS}
          ariaLabel={wheelAriaLabel}
          onSpin={handleSpin}
          disabled={isSpinning}
          onSpinEnd={() => {
            const t = pendingIndexRef.current;
            if (t != null) completeSpin(t);
          }}
        />
      </div>

      <ResultModal
        pattern={currentPattern}
        open={showResult && !isSpinning}
        onClose={() => setShowResult(false)}
        onSpinAgain={() => {
          setShowResult(false);
          handleSpin();
        }}
      />
    </div>
  );
}
