import type { ReactNode } from "react";

/**
 * Replica de la "Mesa — El Showdown". La mecánica es duelo cara a cara
 * con una sola carta privada por jugador y un escenario al centro. El
 * tablero se lee de arriba hacia abajo:
 *
 *   1. Arriba: escenario (grande, destacado) + pozo + botón descarte.
 *   2. Medio: las 3 fases de apuesta (1ª ronda, descarte, 2ª ronda).
 *   3. Bajo: el showdown en sí — argumentación y veredicto.
 *   4. Pie: banner de retiro — regla clave para jugadores que se salen
 *      antes del showdown.
 */
export function ShowdownBoard() {
  return (
    <div className="overflow-x-auto rounded-2xl bg-[--color-felt-900] shadow-[0_12px_40px_rgba(0,0,0,0.5)] ring-2 ring-[--color-gold-500]/40">
      <div className="min-w-[820px] p-3 sm:p-5">
        <Header />

        <div className="mb-4 grid gap-2 sm:grid-cols-[1.6fr_1fr]">
          <Escenario />
          <div className="flex flex-col gap-2">
            <Pozo />
            <DescarteTag />
          </div>
        </div>

        <Zone label="Estructura de apuestas">
          <div className="grid gap-2 sm:grid-cols-3">
            <PhaseCard
              title="1ª RONDA"
              lines={[
                "después de ver tu carta · antes del descarte",
                "apuesta, iguala o retírate",
              ]}
              bg="bg-[#5e5420]"
            />
            <PhaseCard
              title="DESCARTE"
              lines={[
                "pagas 1 ficha al pozo para cambiar tu carta",
                "opcional · solo si sigues en juego",
              ]}
              bg="bg-[#1f3a2a]"
            />
            <PhaseCard
              title="2ª RONDA"
              lines={[
                "apuesta final antes del showdown",
                "puedes subir o ir all-in",
              ]}
              bg="bg-[#134832]"
            />
          </div>
        </Zone>

        <Zone label="El showdown">
          <div className="grid gap-2 sm:grid-cols-2">
            <PhaseCard
              title="ARGUMENTACIÓN"
              lines={[
                "todos revelan su carta simultáneo",
                "cada jugador tiene 45 seg para argumentar por qué su patrón resuelve el escenario mejor",
              ]}
              bg="bg-[#2e1b4b]"
            />
            <PhaseCard
              title="VEREDICTO"
              lines={[
                "el grupo vota levantando la mano",
                "mayoría simple · en empate el dealer decide",
                "ganador se lleva el pozo completo",
              ]}
              bg="bg-[#6b5b18]"
            />
          </div>
        </Zone>

        <RetiroBanner />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-4 rounded-lg bg-black/30 px-4 py-2 text-center ring-1 ring-inset ring-[--color-gold-500]/30">
      <p className="font-label text-sm tracking-[0.3em] text-[--color-gold-300]">
        Mesa — El Showdown
      </p>
    </div>
  );
}

function Escenario() {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[--color-gold-500]/55 bg-[#1e1b4b] px-4 py-6 text-center">
      <p className="font-display text-lg font-black tracking-[0.2em] text-[--color-ivory] sm:text-xl">
        ESCENARIO
      </p>
      <p className="text-[12px] leading-snug text-[--color-cream]/80 sm:text-sm">
        el dealer voltea una tarjeta aquí
      </p>
      <p className="font-label text-[11px] tracking-[0.18em] text-[--color-cream]/65">
        visible para todos
      </p>
    </div>
  );
}

function Pozo() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg bg-[#5a3316] px-4 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/55">
      <p className="font-display text-base font-black tracking-[0.25em] text-[--color-ivory] sm:text-lg">
        POZO
      </p>
      <p className="text-[11px] leading-snug text-[--color-cream]/80 sm:text-xs">
        fichas acumuladas de apuestas y descartes
      </p>
    </div>
  );
}

function DescarteTag() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg bg-[#3a1414] px-4 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/50">
      <p className="font-display text-base font-black tracking-[0.25em] text-[--color-ivory] sm:text-lg">
        DESCARTE
      </p>
      <p className="text-[11px] leading-snug text-[--color-cream]/80 sm:text-xs">
        cuesta 1 ficha al pozo · solo 1 vez por ronda
      </p>
    </div>
  );
}

function PhaseCard({
  title,
  lines,
  bg,
}: {
  title: string;
  lines: string[];
  bg: string;
}) {
  return (
    <div
      className={[
        "flex min-h-[110px] flex-col items-center justify-center gap-1.5 rounded-md px-4 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/50",
        bg,
      ].join(" ")}
    >
      <p className="font-display text-sm font-black tracking-[0.2em] text-[--color-ivory] sm:text-base">
        {title}
      </p>
      {lines.map((l, i) => (
        <p
          key={i}
          className="text-[11px] leading-snug text-[--color-cream]/80 sm:text-xs"
        >
          {l}
        </p>
      ))}
    </div>
  );
}

function RetiroBanner() {
  return (
    <div className="mt-4 rounded-md bg-[#3a1414] px-4 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/50">
      <p className="font-display text-sm font-black tracking-wide text-[--color-ivory] sm:text-base">
        RETIRO — puedes salirte antes del showdown y perder solo lo que apostaste
      </p>
      <p className="mt-1 text-[11px] leading-snug text-[--color-cream]/80 sm:text-xs">
        si nadie más sigue en juego el último que quedó gana el pozo sin argumentar
      </p>
    </div>
  );
}

function Zone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 font-label text-[10px] uppercase tracking-[0.22em] text-[--color-gold-300]/85 sm:text-[11px]">
        {label}
      </p>
      {children}
    </div>
  );
}
