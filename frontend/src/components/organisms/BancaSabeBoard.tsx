import type { ReactNode } from "react";

/**
 * Replica of the "Mesa del Dealer" layout for La Banca Sabe. El juego no
 * tiene rueda digital — el tablero es donde los jugadores colocan fichas
 * y cada zona paga distinto dependiendo de qué tan arriesgada es la
 * apuesta. Tres zonas, de menor a mayor riesgo:
 *
 *   Zona 1 — creer/no creer al dealer (paga 1:1 / 2:1)
 *   Zona 2 — adivinar la categoría GoF real (paga 4:1 / 3:1 / 2:1)
 *   Zona 3 — nombrar el patrón exacto (paga 10:1, pleno)
 *
 * Es un componente puramente visual: no maneja apuestas, solo se muestra
 * en las reglas como referencia del tablero físico.
 */
export function BancaSabeBoard() {
  return (
    <div className="overflow-x-auto rounded-2xl bg-[--color-felt-900] shadow-[0_12px_40px_rgba(0,0,0,0.5)] ring-2 ring-[--color-gold-500]/40">
      <div className="min-w-[720px] p-3 sm:p-5">
        <div className="mb-4 rounded-lg bg-black/30 px-4 py-2 text-center ring-1 ring-inset ring-[--color-gold-500]/30">
          <p className="font-label text-sm tracking-[0.3em] text-[--color-gold-300]">
            Mesa del Dealer
          </p>
        </div>

        <Zone label="Zona 1 — ¿El dealer dice la verdad?">
          <div className="grid gap-2 sm:grid-cols-2">
            <BetSlot
              title="VERDAD"
              detail="el dealer dijo la categoría correcta · paga 1:1"
              bg="bg-[#0e5e3e]"
            />
            <BetSlot
              title="MENTIRA"
              detail="el dealer mintió sobre la categoría · paga 2:1"
              bg="bg-[#6f1d1b]"
            />
          </div>
        </Zone>

        <Zone label="Zona 2 — ¿Cuál es la categoría real? (independiente de lo que dijo el dealer)">
          <div className="grid gap-2 sm:grid-cols-3">
            <BetSlot
              title="CREACIONAL"
              detail="paga 4:1"
              bg="bg-[#0e5e3e]"
            />
            <BetSlot
              title="ESTRUCTURAL"
              detail="paga 3:1"
              bg="bg-[#6f1d1b]"
            />
            <BetSlot
              title="COMPORTAMIENTO"
              detail="paga 2:1"
              bg="bg-[#1e1b4b]"
            />
          </div>
        </Zone>

        <Zone label="Zona 3 — Patrón exacto (pleno)">
          <BetSlot
            title="NOMBRA EL PATRÓN EXACTO antes de la revelación"
            detail="paga 10:1 · se anuncia en voz alta, no se escribe"
            bg="bg-[#1e1b4b]"
          />
        </Zone>
      </div>
    </div>
  );
}

function Zone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="mb-2 font-label text-[10px] uppercase tracking-[0.22em] text-[--color-gold-300]/85 sm:text-[11px]">
        {label}
      </p>
      {children}
    </div>
  );
}

function BetSlot({
  title,
  detail,
  bg,
}: {
  title: string;
  detail: string;
  bg: string;
}) {
  return (
    <div
      className={[
        "flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-md px-3 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/50",
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
