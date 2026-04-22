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
    <div className="flex min-h-full w-full flex-col px-4 py-6 sm:px-6 md:py-8 lg:px-10">
      <header className="mb-6 flex items-center gap-4 md:mb-8">
        <Link
          to="/juegos"
          className="font-label rounded-full border border-[--color-gold-500]/40 px-3 py-1 text-xs text-[--color-cream]/80 hover:bg-white/5"
        >
          ← Volver
        </Link>
        <div className="flex-1 text-center">
          <h1 className="gold-shine font-display text-3xl leading-none md:text-4xl">
            Ruleta de Patrones
          </h1>
          <p className="mt-1 font-label text-xs text-[--color-cream]/70 md:text-sm">
            Toca el centro para girar
          </p>
        </div>
        {/* Spacer to keep the title visually centered between back button and
            the right edge. Width roughly matches the back button. */}
        <span aria-hidden className="w-[78px] shrink-0" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
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
