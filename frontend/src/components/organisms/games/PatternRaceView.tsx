import { useEffect, useMemo, useState } from "react";
import type {
  PatternRaceBlueprintPayload,
  PatternRaceContestantPayload,
  PatternRaceSnapshot,
} from "@/lib/carreraApi";
import {
  PATTERN_KIND_LABEL,
  PATTERN_KIND_TONE,
  formatMsRemaining,
} from "@/domain/patternRace";

type Props = {
  snapshot: PatternRaceSnapshot;
  /** Escala visual — "hero" para la proyección, "compact" para el panel del jugador. */
  size?: "hero" | "compact";
};

/**
 * Visualización de la Carrera de Patrones. Puramente presentacional: toma un
 * snapshot del backend y dibuja:
 *   - Banner del estado (APUESTAS ABIERTAS / CARRERA EN CURSO / RESULTADO).
 *   - Problema del ciclo actual.
 *   - Pista de 6 carriles con los patrones avanzando en función del tiempo
 *     transcurrido (la posición se interpola contra `finishAtMs` — cuando el
 *     elapsed llega a finishAtMs el patrón cruza la meta).
 *   - Podio (resultado de la carrera anterior durante la fase betting).
 *
 * La animación avanza localmente (sin depender de nuevos fetches) interpolando
 * tiempo. El caller sigue poleando para mantener sincronía drift-free, pero
 * entre polls el reloj local mueve a los patrones fluidamente.
 */
export function PatternRaceView({ snapshot, size = "hero" }: Props) {
  // Base de tiempo: al montar registramos (nowLocal - serverNow) para que el
  // "tiempo de servidor" se mantenga bajo control del reloj local aunque no
  // hagamos fetch cada tick. Cuando llega un nuevo snapshot re-sincronizamos.
  const serverNowMs = useMemo(
    () => new Date(snapshot.now).getTime(),
    [snapshot.now],
  );
  const raceStartMs = useMemo(
    () => new Date(snapshot.current.raceStartedAt).getTime(),
    [snapshot.current.raceStartedAt],
  );
  const [localNow, setLocalNow] = useState<number>(Date.now());
  // offset aplica al reloj del navegador para alinear con el servidor.
  const offsetMs = useMemo(() => serverNowMs - Date.now(), [serverNowMs]);

  useEffect(() => {
    const id = window.setInterval(() => setLocalNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, []);

  const now = localNow + offsetMs;
  const raceElapsedMs = Math.max(0, now - raceStartMs);
  const isRacing = snapshot.phase === "racing";
  const isBetting = snapshot.phase === "betting";

  const current = snapshot.current;
  const racingContestants = current.contestants;

  // Posiciones 0..1 por contestant. Durante betting: todos en 0. Durante racing:
  // lerp linear hasta finishAtMs. Tras finishAtMs queda pegado en 1.
  const progress = racingContestants.map((c) => {
    if (!isRacing) return 0;
    if (c.finishAtMs <= 0) return 1;
    const p = Math.min(1, raceElapsedMs / c.finishAtMs);
    // Jitter suave para dar vida. No afecta el orden final (amplitud baja).
    const wobble =
      p >= 1
        ? 0
        : 0.015 *
          Math.sin(
            (raceElapsedMs / 350) * (1.1 + (c.patternId.charCodeAt(0) % 7) * 0.05),
          );
    return Math.max(0, Math.min(1, p + wobble));
  });

  const phaseBanner = (() => {
    if (isBetting) {
      return {
        label: "APUESTAS ABIERTAS",
        sub: `Cierran en ${formatMsRemaining(snapshot.phaseRemainingMs)}`,
        tone: "bg-[--color-chip-green-500] text-white",
      };
    }
    return {
      label: "CARRERA EN CURSO",
      sub: `Termina en ${formatMsRemaining(snapshot.phaseRemainingMs)}`,
      tone: "bg-[--color-chip-red-500] text-white",
    };
  })();

  // Podio: durante betting mostramos el resultado de la carrera anterior.
  // Durante racing, una vez que TODOS cruzaron, mostramos el podio actual.
  const allFinished =
    isRacing &&
    racingContestants.every((c) => raceElapsedMs >= c.finishAtMs);
  const podiumSource: PatternRaceBlueprintPayload | null = isBetting
    ? snapshot.previous
    : allFinished
      ? current
      : null;
  const podium = podiumSource
    ? [...podiumSource.contestants]
        .sort((a, b) => a.finalPosition - b.finalPosition)
        .slice(0, 3)
    : null;

  const hero = size === "hero";
  return (
    <div className="flex flex-col gap-4 text-[--color-ivory]">
      {/* Banner de fase */}
      <div
        className={[
          "rounded-2xl px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1",
          phaseBanner.tone,
          hero ? "text-xl sm:text-2xl" : "text-base",
        ].join(" ")}
      >
        <span className="font-display tracking-[0.25em]">{phaseBanner.label}</span>
        <span className="font-label text-xs sm:text-sm tracking-widest opacity-90">
          {phaseBanner.sub}
        </span>
      </div>

      {/* Problema */}
      <div
        className={[
          "rounded-2xl p-5 bg-[--color-smoke-800]/80 ring-1 ring-inset ring-white/10",
          hero ? "text-lg sm:text-xl" : "text-sm",
        ].join(" ")}
      >
        <div className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/60">
          PROBLEMA DE ESTA CARRERA · #{current.cycleIndex}
        </div>
        <p
          className={[
            "mt-1 font-display text-[--color-ivory]",
            hero ? "text-xl sm:text-2xl leading-snug" : "text-base leading-snug",
          ].join(" ")}
        >
          {current.problem.statement}
        </p>
        {hero && (
          <p className="mt-2 font-label text-xs tracking-widest text-[--color-gold-300]">
            PISTA · {current.problem.hint}
          </p>
        )}
      </div>

      {/* Pista */}
      <div className="rounded-2xl p-4 bg-gradient-to-b from-[--color-felt-700]/80 to-[--color-felt-800]/80 ring-1 ring-inset ring-white/10">
        <ul className="flex flex-col gap-2">
          {racingContestants.map((c, i) => (
            <RaceLane
              key={c.patternId}
              contestant={c}
              progress={progress[i] ?? 0}
              size={size}
              showResult={allFinished || isBetting}
            />
          ))}
        </ul>
      </div>

      {/* Podio */}
      {podium && podium.length > 0 && (
        <div className="rounded-2xl p-4 bg-[--color-smoke-800]/80 ring-1 ring-inset ring-[--color-gold-500]/40">
          <div className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-gold-300]">
            {isBetting
              ? `PODIO · CARRERA #${snapshot.previous?.cycleIndex ?? ""}`
              : `PODIO · CARRERA #${current.cycleIndex}`}
          </div>
          <ol className="mt-2 flex flex-col gap-2">
            {podium.map((c, idx) => (
              <li
                key={c.patternId}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2",
                  idx === 0
                    ? "bg-gradient-to-r from-[--color-gold-500]/30 to-transparent"
                    : "bg-white/5",
                ].join(" ")}
              >
                <span className="font-display text-2xl">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                </span>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[--color-ivory] truncate">
                    {c.label}
                  </div>
                  <div className="font-label text-[0.6rem] tracking-widest text-[--color-cream]/60">
                    {PATTERN_KIND_LABEL[c.kind]} · afinidad +{c.bonus}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function RaceLane({
  contestant,
  progress,
  size,
  showResult,
}: {
  contestant: PatternRaceContestantPayload;
  progress: number;
  size: "hero" | "compact";
  showResult: boolean;
}) {
  const hero = size === "hero";
  const toneGradient = PATTERN_KIND_TONE[contestant.kind];
  const width = `${Math.max(0, Math.min(100, progress * 100))}%`;
  return (
    <li className="relative">
      <div className="flex items-center gap-2">
        <div
          className={[
            "flex items-center gap-2 shrink-0",
            hero ? "w-44" : "w-28",
          ].join(" ")}
        >
          <span className={hero ? "text-2xl" : "text-xl"}>{contestant.emoji}</span>
          <div className="min-w-0">
            <div
              className={[
                "font-display text-[--color-ivory] truncate",
                hero ? "text-base" : "text-sm",
              ].join(" ")}
            >
              {contestant.label}
            </div>
            <div className="font-label text-[0.55rem] tracking-widest text-[--color-cream]/60">
              +{contestant.bonus}
            </div>
          </div>
        </div>
        <div
          className={[
            "relative flex-1 rounded-full bg-black/40 ring-1 ring-inset ring-white/10 overflow-hidden",
            hero ? "h-8" : "h-5",
          ].join(" ")}
        >
          {/* Marcas de meta */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-[--color-gold-400]/80" />
          {/* Barra de avance */}
          <div
            className={[
              "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-[width] duration-100 ease-linear",
              toneGradient,
            ].join(" ")}
            style={{ width }}
          />
          {/* "Jinete" = emoji del patrón sobre la barra */}
          <div
            className={[
              "absolute top-1/2 -translate-y-1/2 transition-[left] duration-100 ease-linear",
              hero ? "text-xl" : "text-sm",
            ].join(" ")}
            style={{ left: `calc(${width} - ${hero ? "0.75rem" : "0.5rem"})` }}
          >
            <span
              style={{
                filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.6))",
              }}
            >
              {contestant.emoji}
            </span>
          </div>
        </div>
        {showResult && (
          <div
            className={[
              "shrink-0 font-display text-[--color-gold-300]",
              hero ? "w-10 text-right text-lg" : "w-8 text-right text-sm",
            ].join(" ")}
          >
            #{contestant.finalPosition}
          </div>
        )}
      </div>
    </li>
  );
}
