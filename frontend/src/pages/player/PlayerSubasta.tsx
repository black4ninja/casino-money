import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Balance } from "@/components/atoms/Balance";
import { TransferToPlayerModal } from "@/components/organisms/TransferToPlayerModal";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/lib/authApi";
import { apiGetAuction, apiRaisePaddle, type Auction } from "@/lib/auctionApi";
import { apiGetMyCasinoSlotWallet } from "@/lib/slotsApi";
import { usePolling } from "@/hooks/usePolling";

const POLL_MS = 2000;
const BID_STEP = 100;

function formatMxn(n: number): string {
  return `$${n.toLocaleString("es-MX")}`;
}

function snap(n: number, step: number): number {
  return Math.round(n / step) * step;
}

/**
 * Vista del jugador dentro de la subasta. El jugador oferta un monto de
 * su elección (múltiplo de $100, ≥ precio actual), no sólo "levanta la
 * paleta" al precio vigente. Quick actions para ofertas comunes:
 *   - "+$100" (mínimo requerido para superar)
 *   - x2 / x3 / x4 del valor actual
 *   - stepper ±$100 para ajuste fino.
 *
 * El monto ofertado nunca puede exceder su saldo en el casino. Durante la
 * subasta otras operaciones están suspendidas, PERO las transferencias
 * entre jugadores siguen permitidas — así quien no alcanza el precio
 * puede financiar a otro compañero y empujarlo a seguir pujando.
 */
export default function PlayerSubasta() {
  const { casinoId } = useParams<{ casinoId: string }>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);
  const user = useAuthStore((s) => s.user);

  const [auction, setAuction] = useState<Auction | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [transferOpen, setTransferOpen] = useState(false);

  const withAuth = useCallback(
    async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
      if (!accessToken) throw { status: 401, message: "no token" } as ApiError;
      try {
        return await fn(accessToken);
      } catch (err) {
        const e = err as ApiError;
        if (e.status !== 401) throw err;
        const fresh = await refresh();
        return fn(fresh);
      }
    },
    [accessToken, refresh],
  );

  const loadAuction = useCallback(async () => {
    if (!casinoId) return;
    try {
      const { auction } = await withAuth((t) => apiGetAuction(t, casinoId));
      setAuction(auction);
      setLoadError(null);
    } catch (err) {
      const e = err as ApiError;
      setLoadError(e.message ?? "No se pudo cargar la subasta.");
    }
  }, [casinoId, withAuth]);

  const loadBalance = useCallback(async () => {
    if (!casinoId) return;
    try {
      const wallet = await withAuth((t) =>
        apiGetMyCasinoSlotWallet(t, casinoId),
      );
      setBalance(wallet.balance);
    } catch {
      setBalance(0);
    }
  }, [casinoId, withAuth]);

  useEffect(() => {
    loadAuction();
    loadBalance();
  }, [loadAuction, loadBalance]);

  // Poll unificado: cada tick refresca auction Y saldo. Esto garantiza que
  // tras un "Vendido" del admin (que debita al ganador) o una transferencia
  // entrante, el saldo se actualice automáticamente sin que el jugador
  // tenga que presionar "Actualizar". El costo extra es una query ligera
  // por ciclo — barato para la ventana típica de una subasta.
  const pollTick = useCallback(async () => {
    await Promise.all([loadAuction(), loadBalance()]);
  }, [loadAuction, loadBalance]);

  usePolling(pollTick, { intervalMs: POLL_MS });

  const currentBid = auction?.currentBid ?? 0;
  const hasInitial = currentBid > 0;
  const iAmCurrent = user && auction?.currentBidderId === user.id;
  const availableBalance = balance ?? 0;

  // El piso de oferta: si nadie tiene paleta, puedes empatar el precio
  // (= currentBid). Si alguien más ya tiene, debes mejorar (+100 mínimo).
  const someoneElseHasPaddle = !!(
    auction?.currentBidderId &&
    user &&
    auction.currentBidderId !== user.id
  );
  const minBid = hasInitial
    ? someoneElseHasPaddle
      ? currentBid + BID_STEP
      : currentBid
    : 0;

  // Inicializa bidAmount cuando cambia el precio/piso para que el input
  // arranque en el mínimo válido en vez de quedarse en un valor stale.
  useEffect(() => {
    if (!hasInitial) {
      setBidAmount(0);
      return;
    }
    setBidAmount((prev) => {
      if (prev < minBid) return minBid;
      if (prev > availableBalance) return Math.min(minBid, availableBalance);
      return prev;
    });
    // Solo reinyectamos cuando cambia el piso o el balance — no cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minBid, currentBid, availableBalance, hasInitial]);

  const quickOptions = useMemo(() => {
    if (!hasInitial) return [];
    return [
      { label: `+${formatMxn(BID_STEP)}`, value: currentBid + BID_STEP },
      { label: "x2", value: currentBid * 2 },
      { label: "x3", value: currentBid * 3 },
      { label: "x4", value: currentBid * 4 },
    ];
  }, [currentBid, hasInitial]);

  function adjustAmount(delta: number) {
    setBidAmount((prev) => {
      const next = snap(Math.max(0, prev + delta), BID_STEP);
      return next;
    });
  }

  function applyQuick(value: number) {
    setBidAmount(snap(value, BID_STEP));
  }

  const bidIsValid =
    hasInitial &&
    bidAmount >= minBid &&
    bidAmount <= availableBalance &&
    bidAmount % BID_STEP === 0;

  const aboveBalance = bidAmount > availableBalance;
  const belowMin = bidAmount < minBid;

  async function handleBid() {
    if (!casinoId || bidding || !bidIsValid) return;
    setBidding(true);
    setBidError(null);
    try {
      const { auction } = await withAuth((t) =>
        apiRaisePaddle(t, casinoId, bidAmount),
      );
      setAuction(auction);
    } catch (err) {
      const e = err as ApiError;
      setBidError(e.message ?? "No se pudo pujar.");
    } finally {
      setBidding(false);
    }
  }

  if (!casinoId) return <Navigate to="/player" replace />;

  return (
    <AppLayout
      title="Subasta"
      subtitle="Oferta tu monto"
      back={{ to: `/player/casino/${casinoId}`, label: "" }}
    >
      {loadError && (
        <Card tone="night">
          <p
            role="alert"
            className="font-label text-sm tracking-wider text-[--color-carmine-400]"
          >
            {loadError}
          </p>
        </Card>
      )}

      {/* Estado de la ronda */}
      <Card tone="night" className="flex flex-col items-center gap-3 py-8">
        <p className="font-label text-[0.7rem] tracking-[0.3em] text-[--color-cream]/60">
          VALOR ACTUAL
        </p>
        {hasInitial ? (
          <Balance amount={currentBid} size="lg" />
        ) : (
          <>
            <span className="font-display text-4xl text-[--color-cream]/40">
              —
            </span>
            <p className="text-center font-label text-xs tracking-widest text-[--color-cream]/60">
              Esperando al anunciador para abrir la ronda…
            </p>
          </>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {auction?.currentBidderAlias ? (
            iAmCurrent ? (
              <Badge tone="gold">tu oferta está arriba</Badge>
            ) : (
              <>
                <Badge tone="info">pujando</Badge>
                <span className="font-display text-lg text-[--color-ivory]">
                  {auction.currentBidderAlias}
                </span>
              </>
            )
          ) : (
            hasInitial && <Badge tone="neutral">nadie ha pujado aún</Badge>
          )}
        </div>

        <p className="font-label text-[0.6rem] tracking-[0.3em] text-[--color-cream]/40">
          Ronda #{auction?.roundNumber ?? 1}
        </p>

        <div className="mt-3 flex flex-col items-center gap-2 border-t border-white/10 pt-3 w-full">
          <span className="font-label text-[0.6rem] tracking-[0.3em] text-[--color-cream]/55">
            TU SALDO EN ESTE CASINO
          </span>
          <Balance amount={availableBalance} size="md" />
          <Button
            variant="ghost"
            size="sm"
            onClick={loadBalance}
            aria-label="Actualizar saldo"
            title="Refrescar saldo — úsalo después de recibir una transferencia"
          >
            ↻ Actualizar saldo
          </Button>
        </div>
      </Card>

      {/* Panel de puja */}
      {hasInitial && (
        <Card tone="night" className="flex flex-col gap-4">
          <h3 className="font-display text-xl text-[--color-ivory]">
            Tu oferta
          </h3>
          <p className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
            Mínimo permitido: {formatMxn(minBid)}
            {someoneElseHasPaddle && " (superas la oferta actual)"}
          </p>

          {/* Quick actions */}
          <div className="flex flex-col gap-2">
            <span className="font-label text-[0.6rem] tracking-[0.3em] text-[--color-cream]/50">
              OFERTAS RÁPIDAS
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {quickOptions.map((opt) => {
                const disabled =
                  opt.value > availableBalance || opt.value < minBid;
                return (
                  <Button
                    key={opt.label}
                    variant={opt.value === bidAmount ? "primary" : "felt"}
                    size="sm"
                    onClick={() => applyQuick(opt.value)}
                    disabled={disabled || bidding}
                    className="touch-manipulation"
                    style={{ minHeight: "64px" }}
                  >
                    <div className="flex flex-col items-center leading-tight">
                      <span className="text-base">{opt.label}</span>
                      <span className="font-mono text-[0.65rem] opacity-85">
                        {formatMxn(opt.value)}
                      </span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Stepper fino */}
          <div className="flex flex-col gap-2">
            <span className="font-label text-[0.6rem] tracking-[0.3em] text-[--color-cream]/50">
              AJUSTE FINO
            </span>
            <div className="flex items-stretch gap-2">
              <Button
                variant="felt"
                size="sm"
                onClick={() => adjustAmount(-BID_STEP)}
                disabled={bidding || bidAmount - BID_STEP < minBid}
                className="touch-manipulation"
                style={{ minWidth: "72px", minHeight: "64px" }}
                aria-label="Restar $100"
              >
                −$100
              </Button>
              <div className="flex flex-1 flex-col items-center justify-center rounded-full bg-[--color-smoke]/60 px-4 py-2 ring-1 ring-inset ring-white/5">
                <span className="gold-shine font-display text-3xl leading-none">
                  {formatMxn(bidAmount)}
                </span>
                <span
                  className={[
                    "font-label text-[0.6rem] tracking-[0.3em] mt-1",
                    aboveBalance
                      ? "text-[--color-chip-red-300]"
                      : belowMin
                        ? "text-[--color-chip-red-300]"
                        : "text-[--color-cream]/60",
                  ].join(" ")}
                >
                  {aboveBalance
                    ? "supera tu saldo"
                    : belowMin
                      ? `mínimo ${formatMxn(minBid)}`
                      : `te quedan ${formatMxn(Math.max(0, availableBalance - bidAmount))}`}
                </span>
              </div>
              <Button
                variant="felt"
                size="sm"
                onClick={() => adjustAmount(BID_STEP)}
                disabled={bidding || bidAmount + BID_STEP > availableBalance}
                className="touch-manipulation"
                style={{ minWidth: "72px", minHeight: "64px" }}
                aria-label="Sumar $100"
              >
                +$100
              </Button>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleBid}
            disabled={!bidIsValid || bidding}
            block
          >
            {bidding
              ? "Pujando…"
              : aboveBalance
                ? "Saldo insuficiente"
                : belowMin
                  ? `Oferta mínima ${formatMxn(minBid)}`
                  : `Pujar ${formatMxn(bidAmount)}`}
          </Button>

          {iAmCurrent && (
            <p className="text-center font-label text-[0.65rem] tracking-[0.25em] text-[--color-cream]/60">
              Tu oferta sigue en pie. Puedes subirla si quieres reafirmar
              antes de que alguien te supere.
            </p>
          )}
        </Card>
      )}

      {/* Transferir durante la subasta — para fondear compañeros.
          Solo visible para players: los dealers no transfieren fichas
          (su saldo es comisión personal y el endpoint de transferencia
          exige que ambas partes sean role=player). */}
      {user?.role === "player" && (
        <Card tone="night" className="flex flex-col gap-3">
          <h3 className="font-display text-xl text-[--color-ivory]">
            Financiar a otro jugador
          </h3>
          <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
            Si no puedes pujar más, manda tus fichas a alguien de tu equipo
            que sí pueda seguir.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => setTransferOpen(true)}
            disabled={!availableBalance || availableBalance <= 0}
          >
            Transferir a otro jugador →
          </Button>
        </Card>
      )}

      {bidError && (
        <Card tone="night">
          <p
            role="alert"
            className="font-label text-sm tracking-wider text-[--color-carmine-400]"
          >
            {bidError}
          </p>
        </Card>
      )}

      {/* Oferta firme previa */}
      {auction?.lastConfirmedBidderAlias &&
        auction.lastConfirmedBid !== null && (
          <Card tone="night" className="flex flex-col items-center gap-2 py-6">
            <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
              ÚLTIMA OFERTA EN FIRME
            </span>
            <Balance amount={auction.lastConfirmedBid} size="md" />
            <span className="font-display text-lg text-[--color-ivory]">
              {auction.lastConfirmedBidderAlias}
            </span>
            <p className="text-center font-label text-[0.6rem] tracking-[0.25em] text-[--color-cream]/55">
              Si nadie puja al precio actual, ésta queda.
            </p>
          </Card>
        )}

      {/* Última venta */}
      {auction?.lastSoldBidderAlias && auction.lastSoldBid !== null && (
        <Card tone="night" className="flex flex-col items-center gap-2 py-6">
          <Badge tone="success">ÚLTIMO VENDIDO</Badge>
          <Balance amount={auction.lastSoldBid} size="md" />
          <span className="font-display text-lg text-[--color-ivory]">
            {auction.lastSoldBidderAlias}
          </span>
        </Card>
      )}

      <TransferToPlayerModal
        open={transferOpen}
        casinoId={casinoId}
        senderBalance={availableBalance}
        onClose={() => setTransferOpen(false)}
        onTransferred={(newBalance) => {
          setBalance(newBalance);
          // Reajusta la oferta hacia el mínimo válido si quedó arriba del saldo.
          setBidAmount((prev) => Math.min(prev, newBalance));
        }}
      />
    </AppLayout>
  );
}
