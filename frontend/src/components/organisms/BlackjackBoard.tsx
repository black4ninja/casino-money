import type { ReactNode } from "react";

/**
 * Replica de la "Mesa — Plántate" de Blackjack de Patrones. La apuesta
 * se coloca antes de ver cualquier pista; el dealer revela 6 pistas
 * (×6 → ×1) cada vez más fáciles. El jugador grita "¡Me planto!" +
 * nombre del patrón y además debe dibujar el UML. Cobra según qué tan
 * completo quedó su diagrama.
 *
 * El tablero se divide en 4 zonas:
 *   1. Pistas (1..6) con sub-strip de progreso del UML.
 *   2. Diagrama (qué pide la mesa cuando alguien se planta).
 *   3. Tabla de cobro (3 casos que pagan + 2 casos donde gana la casa).
 *   4. Posiciones de jugadores (J1..J4).
 */
export function BlackjackBoard() {
  return (
    <div className="overflow-x-auto rounded-2xl bg-[--color-felt-900] shadow-[0_12px_40px_rgba(0,0,0,0.5)] ring-2 ring-[--color-gold-500]/40">
      <div className="min-w-[860px] p-3 sm:p-5">
        <Header />

        <Zone label="Zona de pistas — el dealer revela una a la vez">
          <div className="grid grid-cols-6 gap-2">
            <PistaCard
              n={1}
              mult={6}
              detail="el problema más difícil"
              bg="bg-[#0e5e3e]"
            />
            <PistaCard
              n={2}
              mult={5}
              detail="el dominio"
              bg="bg-[#188049]"
            />
            <PistaCard
              n={3}
              mult={4}
              detail="UML — 1ª clase sola"
              bg="bg-[#3e8c3a]"
            />
            <PistaCard
              n={4}
              mult={3}
              detail="UML — 2ª clase aparece"
              bg="bg-[#8a6d1f]"
            />
            <PistaCard
              n={5}
              mult={2}
              detail="UML — relaciones completas"
              bg="bg-[#8a2a1f]"
            />
            <PistaCard
              n={6}
              mult={1}
              detail="hint casi directo"
              bg="bg-[#5a1a1a]"
            />
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <UmlSubLabel text="Pista 3 — UML parcial" />
            <UmlSubLabel text="Pista 4 — UML creciendo" />
            <UmlSubLabel text="Pista 5 — UML completo" />
          </div>
        </Zone>

        <Zone label="Zona de diagrama — cuando un jugador se planta">
          <div className="grid gap-2 sm:grid-cols-[1fr_240px]">
            <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-md bg-[#1e1b4b] px-4 py-5 text-center ring-1 ring-inset ring-[--color-gold-500]/50">
              <p className="font-display text-base font-black tracking-wide text-[--color-ivory] sm:text-lg">
                DIBUJA EL UML COMPLETO
              </p>
              <p className="text-[12px] leading-snug text-[--color-cream]/80 sm:text-sm">
                el jugador recibe hoja en blanco y dibuja de memoria
              </p>
              <p className="font-label text-[11px] tracking-[0.18em] text-[--color-cream]/65">
                clases · relaciones · nombres de métodos clave
              </p>
            </div>
            <div className="flex min-h-[120px] flex-col items-center justify-center gap-1 rounded-md bg-[#2e1b4b] px-4 py-5 text-center ring-1 ring-inset ring-[--color-gold-500]/50">
              <p className="font-display text-4xl font-black leading-none text-[--color-gold-300] sm:text-5xl">
                60&quot;
              </p>
              <p className="text-[11px] leading-snug text-[--color-cream]/80 sm:text-xs">
                tiempo para completar el diagrama
              </p>
            </div>
          </div>
        </Zone>

        <Zone label="Tabla de cobro">
          <div className="grid gap-2 sm:grid-cols-3">
            <PayoutSlot
              title={<>NOMBRE ✓<br />DIAGRAMA ✓</>}
              detail="cobras el multiplicador completo"
              bg="bg-[#184a2a]"
            />
            <PayoutSlot
              title={<>NOMBRE ✓<br />DIAGRAMA PARCIAL</>}
              detail="cobras la mitad del multiplicador"
              bg="bg-[#5e5420]"
            />
            <PayoutSlot
              title="NOMBRE ✕"
              detail="pierdes tu apuesta · el diagrama no importa · sales de la ronda"
              bg="bg-[#6f1d1b]"
            />
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <PayoutSlot
              title="NADIE SE PLANTA EN 6 PISTAS"
              detail="la casa se lleva todo el pozo"
              bg="bg-[#1a1a1a]"
            />
            <PayoutSlot
              title="TODOS FALLAN EL NOMBRE"
              detail="la casa se lleva todo el pozo"
              bg="bg-[#1a1a1a]"
            />
          </div>
        </Zone>

        <Zone label="Posiciones de jugadores">
          <div className="grid gap-2 sm:grid-cols-4">
            {["J1", "J2", "J3", "J4"].map((p) => (
              <PlayerSlot key={p} name={p} detail="apuesta antes de pista 1" />
            ))}
          </div>
        </Zone>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-4 rounded-lg bg-black/30 px-4 py-2 text-center ring-1 ring-inset ring-[--color-gold-500]/30">
      <p className="font-label text-sm tracking-[0.3em] text-[--color-gold-300]">
        Mesa — Plántate
      </p>
    </div>
  );
}

function PistaCard({
  n,
  mult,
  detail,
  bg,
}: {
  n: number;
  mult: number;
  detail: string;
  bg: string;
}) {
  return (
    <div
      className={[
        "flex min-h-[128px] flex-col items-center justify-start gap-1 rounded-md px-2 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/50",
        bg,
      ].join(" ")}
    >
      <p className="font-display text-2xl font-black leading-none text-[--color-ivory] sm:text-3xl">
        ×{mult}
      </p>
      <p className="font-display text-sm font-bold text-[--color-ivory] sm:text-base">
        Pista {n}
      </p>
      <p className="text-[11px] leading-snug text-[--color-cream]/80 sm:text-xs">
        {detail}
      </p>
    </div>
  );
}

function UmlSubLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-md border border-dashed border-[--color-gold-500]/45 bg-black/20 px-3 py-2 text-center">
      <p className="font-label text-[10px] tracking-[0.18em] text-[--color-cream]/70 sm:text-[11px]">
        {text}
      </p>
    </div>
  );
}

function PayoutSlot({
  title,
  detail,
  bg,
}: {
  title: ReactNode;
  detail: string;
  bg: string;
}) {
  return (
    <div
      className={[
        "flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-md px-3 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/50",
        bg,
      ].join(" ")}
    >
      <p className="font-display text-sm font-black leading-tight tracking-wide text-[--color-ivory] sm:text-base">
        {title}
      </p>
      <p className="text-[11px] leading-snug text-[--color-cream]/80 sm:text-xs">
        {detail}
      </p>
    </div>
  );
}

function PlayerSlot({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex min-h-[78px] flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-[--color-gold-500]/40 bg-black/20 px-3 py-3 text-center">
      <p className="font-display text-lg font-black text-[--color-ivory]">
        {name}
      </p>
      <p className="text-[11px] leading-snug text-[--color-cream]/70 sm:text-xs">
        {detail}
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
