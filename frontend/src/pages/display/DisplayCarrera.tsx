import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { PatternRaceView } from "@/components/organisms/games/PatternRaceView";
import { apiGetPatternRaceCurrent, type PatternRaceSnapshot } from "@/lib/carreraApi";
import type { ApiError } from "@/lib/authApi";

/**
 * /display/casino/:casinoId/carrera — vista pública (sin auth) pensada para
 * proyección. Layout "TV": un solo scroll vertical sin AppLayout, fondo felt
 * saturado, tipografía grande. Poleo cada 1.5s para refrescar el estado
 * (el reloj local interpola entre polls, así que la animación fluye).
 *
 * El poll es ligero: el backend recomputa el outcome (determinista) en vez
 * de leer un registro, así que no hay costo por carga repetida.
 */
export default function DisplayCarrera() {
  const { casinoId } = useParams<{ casinoId: string }>();
  const [snapshot, setSnapshot] = useState<PatternRaceSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    if (!casinoId) {
      setError("URL inválida: falta casinoId");
      return;
    }
    let timer: number | null = null;
    const tick = async () => {
      try {
        const snap = await apiGetPatternRaceCurrent(casinoId);
        if (!aliveRef.current) return;
        setSnapshot(snap);
        setError(null);
      } catch (err) {
        if (!aliveRef.current) return;
        const e = err as ApiError;
        setError(e.message ?? "No se pudo cargar la carrera.");
      } finally {
        if (aliveRef.current) {
          timer = window.setTimeout(tick, 1500);
        }
      }
    };
    tick();
    return () => {
      aliveRef.current = false;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [casinoId]);

  return (
    <div
      className="landing-bg-fixed min-h-screen w-full overflow-x-hidden text-[--color-ivory]"
      style={{
        paddingInline: "clamp(1.5rem, 6vw, 10rem)",
        paddingBlock: "clamp(2rem, 5vw, 5rem)",
      }}
    >
      <div className="mx-auto w-full max-w-6xl flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <div className="font-label text-[0.65rem] tracking-[0.4em] text-[--color-gold-400]">
            CASINO · PROYECCIÓN EN VIVO
          </div>
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl text-[--color-ivory] leading-tight break-words">
            🏁 Carrera de Patrones
          </h1>
          {snapshot && (
            <div className="font-label text-xs tracking-widest text-[--color-cream]/70">
              {snapshot.casino.name}
            </div>
          )}
        </header>

        {error && (
          <div className="rounded-2xl p-5 bg-[--color-chip-red-500]/20 ring-1 ring-inset ring-[--color-chip-red-500]/40 text-[--color-chip-red-200]">
            {error}
          </div>
        )}

        {!snapshot && !error && (
          <div className="rounded-2xl p-8 bg-[--color-smoke-800]/60 ring-1 ring-inset ring-white/10 font-label tracking-widest text-center">
            Conectando con la pista…
          </div>
        )}

        {snapshot && <PatternRaceView snapshot={snapshot} size="hero" />}

        {/* Leyenda didáctica para la audiencia que proyecta la carrera. */}
        {snapshot && (
          <div className="rounded-xl bg-[--color-smoke-800]/60 px-5 py-3 ring-1 ring-inset ring-[--color-gold-500]/30">
            <div className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-gold-300]">
              💡 LEYENDA · AFINIDAD
            </div>
            <p className="mt-1 font-label text-xs sm:text-sm leading-snug text-[--color-cream]/85">
              El número junto a cada patrón (<span className="font-display">+0</span>
              … <span className="font-display text-[--color-chip-green-300]">+5</span>
              ) indica qué tan bien resuelve{" "}
              <strong className="text-[--color-ivory]">este problema</strong>.
              Más afinidad ⇒ avanza más rápido. Los{" "}
              <span className="text-[--color-chip-red-300]">anti-patrones</span>{" "}
              (💀🍝📋) corren fuerte pero chocan seguido — pagan mucho si
              ganan, rara vez lo logran.
            </p>
          </div>
        )}

        <footer className="mt-2 font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/40 text-center">
          ¿Quién creen que va a ganar? Los patrones corren según el problema. No hay patrón universal.
        </footer>
      </div>
    </div>
  );
}
