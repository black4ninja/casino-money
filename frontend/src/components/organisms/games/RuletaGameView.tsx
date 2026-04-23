import { useEffect, useMemo, useRef, useState } from "react";
import { RouletteWheel } from "../RouletteWheel";
import { ResultModal } from "../../molecules/ResultModal";
import {
  PATTERNS,
  PATTERN_COUNT,
  CATEGORY_LABEL,
} from "@/domain/designPatterns";
import { randomInt, randomFloat } from "@/crypto/random";

const SLOT_ANGLE = 360 / PATTERN_COUNT;
const BASE_ROTATIONS = 8;
// Matches the length of /audio/roulette-spin.mp3 — wheel and audio end together.
const SPIN_DURATION_MS = 10000;
const AUDIO_SPIN_SRC = "/audio/roulette-spin.mp3";
const AUDIO_WIN_SRC = "/audio/slot-win.mp3";
const MUTE_STORAGE_KEY = "ruleta:muted";

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

/** Persisted mute preference — survives reload and applies to audio elements. */
function useMutedPreference(): [boolean, (next: boolean) => void] {
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  });
  const update = (next: boolean) => {
    setMuted(next);
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, next ? "true" : "false");
    } catch {
      // localStorage disabled; swallow.
    }
  };
  return [muted, update];
}

type Props = {
  /**
   * Fired after the wheel settles on a pattern. The dealer mesa tab passes
   * this to persist the result (POST /mesas/:id/spins). The standalone
   * /juegos/ruleta page omits it — that view is a demo without an owner.
   * Errors are the host's to handle; the game keeps running regardless.
   */
  onSpinComplete?: (patternId: string) => void | Promise<void>;
};

/**
 * The playable roulette — wheel, sounds, spin logic, result modal, and
 * decorative mascots. Self-contained: drop it anywhere (standalone page,
 * dealer mesa tab, simulator). Does NOT carry page-level chrome (title,
 * back button, etc.) — host provides those around it.
 */
export function RuletaGameView({ onSpinComplete }: Props = {}) {
  const reduced = useReducedMotion();
  const [muted, setMuted] = useMutedPreference();
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  // Bumped on every new spin so the card-twirl animation remounts (key-based
  // restart). Without this, rapid consecutive spins wouldn't re-trigger the
  // CSS keyframe animation.
  const [spinAnimKey, setSpinAnimKey] = useState(0);
  const pendingIndexRef = useRef<number | null>(null);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const spin = new Audio(AUDIO_SPIN_SRC);
    spin.preload = "auto";
    spinAudioRef.current = spin;

    const win = new Audio(AUDIO_WIN_SRC);
    win.preload = "auto";
    winAudioRef.current = win;

    return () => {
      spin.pause();
      win.pause();
      spinAudioRef.current = null;
      winAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (spinAudioRef.current) spinAudioRef.current.muted = muted;
    if (winAudioRef.current) winAudioRef.current.muted = muted;
  }, [muted]);

  function playSpinAudio() {
    const audio = spinAudioRef.current;
    if (!audio || reduced) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function stopSpinAudio() {
    const audio = spinAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  function playWinAudio() {
    const audio = winAudioRef.current;
    if (!audio || reduced) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function handleSpin() {
    if (isSpinning) return;
    const target = randomInt(0, PATTERN_COUNT - 1);
    pendingIndexRef.current = target;

    const jitter = randomFloat(-SLOT_ANGLE / 3, SLOT_ANGLE / 3);
    const currentMod = rotation % 360;
    const normalizedTarget =
      ((-target * SLOT_ANGLE + jitter - currentMod) % 360 + 360) % 360;
    const delta = BASE_ROTATIONS * 360 + normalizedTarget;

    setShowResult(false);
    setIsSpinning(true);
    setSpinAnimKey((k) => k + 1);
    setRotation((r) => r + delta);
    playSpinAudio();

    if (reduced) {
      stopSpinAudio();
      setTimeout(() => completeSpin(target), 0);
    }
  }

  function completeSpin(target: number) {
    setCurrentIndex(target);
    setIsSpinning(false);
    setShowResult(true);
    playWinAudio();
    pendingIndexRef.current = null;
    // Notify host (e.g. dealer mesa) so it can persist the outcome. Fire
    // and forget — the game UX must not stall on a network round-trip.
    const pattern = PATTERNS[target];
    if (pattern && onSpinComplete) {
      try {
        const result = onSpinComplete(pattern.id);
        if (result && typeof (result as Promise<void>).catch === "function") {
          (result as Promise<void>).catch((err) => {
            console.warn("[ruleta] onSpinComplete failed:", err);
          });
        }
      } catch (err) {
        console.warn("[ruleta] onSpinComplete threw:", err);
      }
    }
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
    <div className="relative flex flex-col items-center gap-6">
      {/* Mute toggle — top-right of the playable area. */}
      <button
        type="button"
        aria-label={muted ? "Activar sonido" : "Silenciar"}
        onClick={() => setMuted(!muted)}
        className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-[--color-gold-500]/40 bg-[--color-smoke]/70 text-base text-[--color-gold-300] transition hover:border-[--color-gold-400] hover:text-[--color-gold-400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400]"
      >
        {muted ? "🔇" : "🔊"}
      </button>

      <div className="relative flex w-full min-h-[calc(100vh-16rem)] items-center justify-center">
        {/* Decorative mascots — pinned outside the wheel, hidden below lg. */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: "calc(50% + 380px)",
            transform: "translateY(-50%)",
            perspective: "800px",
          }}
          className="pointer-events-none hidden lg:block"
        >
          <picture>
            <source srcSet="/images/phanphy-joker.avif" type="image/avif" />
            <source srcSet="/images/phanphy-joker.webp" type="image/webp" />
            <img
              key={`mascot-left-${spinAnimKey}`}
              src="/images/phanphy-joker.webp"
              alt=""
              aria-hidden
              loading="lazy"
              className={[
                "h-64 w-auto select-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] xl:h-72 2xl:h-80",
                isSpinning && !reduced ? "animate-card-twirl" : "",
              ].join(" ")}
            />
          </picture>
        </div>

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

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "calc(50% + 380px)",
            transform: "translateY(-50%) scaleX(-1)",
            perspective: "800px",
          }}
          className="pointer-events-none hidden lg:block"
        >
          <picture>
            <source srcSet="/images/phanphy-joker.avif" type="image/avif" />
            <source srcSet="/images/phanphy-joker.webp" type="image/webp" />
            <img
              key={`mascot-right-${spinAnimKey}`}
              src="/images/phanphy-joker.webp"
              alt=""
              aria-hidden
              loading="lazy"
              className={[
                "h-64 w-auto select-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] xl:h-72 2xl:h-80",
                isSpinning && !reduced ? "animate-card-twirl" : "",
              ].join(" ")}
            />
          </picture>
        </div>
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
