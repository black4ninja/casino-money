import type { ReactNode } from "react";

/**
 * Replica de la "Mesa — Tira o Paga". Cada ronda gira alrededor de un
 * "lanzador" que anuncia un patrón y tira un dado para determinar la
 * dificultad del reto. El tablero se lee por pasos:
 *
 *   Paso 1 — anuncio del patrón + apuesta obligatoria del lanzador.
 *   Paso 2 — el dado decide dificultad Fácil/Medio/Difícil con
 *            multiplicadores ×2/×3/×5 y tipos de exigencia distintos.
 *   Paso 3 — el dealer elige el formato del reto (Participantes o
 *            Detecta el Error) después de ver el dado.
 *   Paso 4 — todos los jugadores (incluyendo el lanzador) resuelven
 *            simultáneo en 60 segundos.
 *   Resolución — un ganador / empate / nadie acierta.
 *   Pie — recordatorio de que el lanzador también compite.
 */
export function TiraOPagaBoard() {
  return (
    <div className="overflow-x-auto rounded-2xl bg-[--color-felt-900] shadow-[0_12px_40px_rgba(0,0,0,0.5)] ring-2 ring-[--color-gold-500]/40">
      <div className="min-w-[900px] p-3 sm:p-5">
        <Header />

        <Zone label="Paso 1 — el lanzador elige el patrón y apuesta antes de tirar">
          <div className="grid gap-2 sm:grid-cols-2">
            <InfoCard
              title="PATRÓN ANUNCIADO"
              lines={[
                "el lanzador lo dice en voz alta antes de tirar",
                "todos van a competir sobre este patrón",
              ]}
              bg="bg-[#1e1b4b]"
            />
            <InfoCard
              title="APUESTA DEL LANZADOR"
              lines={[
                "apuesta obligatoria al pozo antes de tirar",
                "puede apostar extra a la dificultad que espera sacar",
              ]}
              bg="bg-[#4a2a15]"
            />
          </div>
        </Zone>

        <Zone label="Paso 2 — el dado determina la dificultad · nadie la controla">
          <div className="grid gap-2 sm:grid-cols-3">
            <DifficultyCard
              mult="×2"
              face="1 — 2"
              label="FÁCIL"
              demands={[
                "Participantes: solo nombrarlos",
                "Error: error obvio en código",
              ]}
              footer="el lanzador paga 1:1 · los demás cobran ×2 si ganan"
              bg="bg-[#1f4a2a]"
            />
            <DifficultyCard
              mult="×3"
              face="3 — 4"
              label="MEDIO"
              demands={[
                "Participantes: nombrar + rol de cada uno",
                "Error: error sutil + corrección",
              ]}
              footer="el lanzador paga 2:1 · los demás cobran ×3 si ganan"
              bg="bg-[#6b5b18]"
            />
            <DifficultyCard
              mult="×5"
              face="5 — 6"
              label="DIFÍCIL"
              demands={[
                "Participantes: nombrar + rol + flujo completo",
                "Error: dos errores entrelazados",
              ]}
              footer="el lanzador paga 3:1 · los demás cobran ×5 si ganan"
              bg="bg-[#6f1d1b]"
            />
          </div>
        </Zone>

        <Zone label="Paso 3 — el dealer elige el tipo de reto después de ver el dado">
          <div className="grid gap-2 sm:grid-cols-2">
            <InfoCard
              title="PARTICIPANTES"
              lines={[
                "todos escriben en papel simultáneamente",
                "el dealer revisa todas las respuestas al mismo tiempo",
              ]}
              bg="bg-[#1e1b4b]"
            />
            <InfoCard
              title="DETECTA EL ERROR"
              lines={[
                "el dealer lee el código en voz alta una sola vez",
                "todos escriben el error y la corrección en papel",
              ]}
              bg="bg-[#2e1b4b]"
            />
          </div>
        </Zone>

        <Zone label="Paso 4 — todos resuelven simultáneo · 60 segundos">
          <div className="grid gap-2 sm:grid-cols-4">
            <PlayerSlot
              name="J1 — LANZADOR"
              lines={[
                "resuelve junto con todos",
                "si gana recupera su apuesta + premio",
              ]}
            />
            <PlayerSlot
              name="J2"
              lines={["apuesta antes del dado", "compite por el pozo"]}
            />
            <PlayerSlot
              name="J3"
              lines={["apuesta antes del dado", "compite por el pozo"]}
            />
            <PlayerSlot
              name="J4"
              lines={["apuesta antes del dado", "compite por el pozo"]}
            />
          </div>
        </Zone>

        <Zone label="Resolución">
          <div className="grid gap-2 sm:grid-cols-3">
            <InfoCard
              title="UN GANADOR"
              lines={[
                "primer jugador en entregar respuesta correcta completa",
                "se lleva el pozo × multiplicador de dificultad",
              ]}
              bg="bg-[#1f4a2a]"
            />
            <InfoCard
              title="EMPATE"
              lines={[
                "dos o más entregan correcta al mismo tiempo",
                "el pozo se divide entre ellos",
              ]}
              bg="bg-[#5e5420]"
            />
            <InfoCard
              title="NADIE ACIERTA"
              lines={[
                "la casa se lleva el pozo completo",
                "el dealer revela la respuesta correcta",
              ]}
              bg="bg-[#3a1414]"
            />
          </div>
        </Zone>

        <LanzadorBanner />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-4 rounded-lg bg-black/30 px-4 py-2 text-center ring-1 ring-inset ring-[--color-gold-500]/30">
      <p className="font-label text-sm tracking-[0.3em] text-[--color-gold-300]">
        Mesa — Tira o Paga
      </p>
    </div>
  );
}

function InfoCard({
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
        "flex min-h-[100px] flex-col items-center justify-center gap-1.5 rounded-md px-4 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/50",
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

function DifficultyCard({
  mult,
  face,
  label,
  demands,
  footer,
  bg,
}: {
  mult: string;
  face: string;
  label: string;
  demands: string[];
  footer: string;
  bg: string;
}) {
  return (
    <div
      className={[
        "flex min-h-[180px] flex-col items-center justify-start gap-2 rounded-md px-3 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/50",
        bg,
      ].join(" ")}
    >
      <p className="font-display text-3xl font-black leading-none text-[--color-gold-300] sm:text-4xl">
        {mult}
      </p>
      <p className="flex items-center gap-1 font-display text-sm font-black text-[--color-ivory] sm:text-base">
        <span aria-hidden>🎲</span>
        <span>{face}</span>
        <span className="font-label tracking-[0.2em]">{label}</span>
      </p>
      <div className="mt-1 space-y-1">
        {demands.map((d, i) => (
          <p
            key={i}
            className="text-[11px] leading-snug text-[--color-cream]/85 sm:text-xs"
          >
            {d}
          </p>
        ))}
      </div>
      <p className="mt-auto pt-2 text-[11px] leading-snug text-[--color-cream]/65 sm:text-xs">
        {footer}
      </p>
    </div>
  );
}

function PlayerSlot({ name, lines }: { name: string; lines: string[] }) {
  return (
    <div className="flex min-h-[92px] flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-[--color-gold-500]/40 bg-black/20 px-3 py-3 text-center">
      <p className="font-display text-sm font-black text-[--color-ivory] sm:text-base">
        {name}
      </p>
      {lines.map((l, i) => (
        <p
          key={i}
          className="text-[11px] leading-snug text-[--color-cream]/70 sm:text-xs"
        >
          {l}
        </p>
      ))}
    </div>
  );
}

function LanzadorBanner() {
  return (
    <div className="mt-4 rounded-md bg-[#1a1a1a] px-4 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/50">
      <p className="font-display text-sm font-black leading-snug text-[--color-ivory] sm:text-base">
        EL LANZADOR TAMBIÉN COMPITE — si gana recupera su apuesta + cobra como cualquier otro jugador · si pierde paga según la dificultad que cayó
      </p>
      <p className="mt-2 text-[11px] leading-snug text-[--color-cream]/80 sm:text-xs">
        la ventaja del lanzador es elegir el patrón que mejor domina · su desventaja es que paga aunque no gane
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
