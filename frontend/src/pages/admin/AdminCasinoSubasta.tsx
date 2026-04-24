import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/templates/AdminLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Balance } from "@/components/atoms/Balance";
import { Input } from "@/components/atoms/Input";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/lib/authApi";
import { apiGetCasino, type Casino } from "@/lib/casinoApi";
import {
  apiAdjustAuction,
  apiGetAuction,
  apiMarkAuctionSold,
  apiResetAuction,
  apiSetAuctionInitial,
  type Auction,
} from "@/lib/auctionApi";
import { usePolling } from "@/hooks/usePolling";

const POLL_MS = 3000;

const INCREMENTS = [
  { label: "+$1,000", factor: 1_000 },
  { label: "+$10,000", factor: 10_000 },
  { label: "+$100,000", factor: 100_000 },
] as const;

const MULTIPLIERS = [2, 3, 4] as const;

function formatMxn(n: number): string {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Panel del anunciador. Controles del estado de la puja en tiempo real:
 * valor inicial, incrementos fijos, multiplicadores y reset de ronda.
 * El mismo estado se ve en /display/casino/:id/subasta (sin auth, proyector)
 * y en /player/casino/:id/subasta (paleta).
 *
 * El panel polled cada 3s para reflejar paletas de jugadores; los controles
 * son síncronos (responde con el nuevo estado, no espera al poll).
 */
export default function AdminCasinoSubasta() {
  const { id } = useParams<{ id: string }>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [casino, setCasino] = useState<Casino | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [initialInput, setInitialInput] = useState<string>("100");

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

  const loadCasino = useCallback(async () => {
    if (!id) return;
    try {
      const { casino } = await withAuth((t) => apiGetCasino(t, id));
      setCasino(casino);
    } catch (err) {
      const e = err as ApiError;
      setLoadError(e.message ?? "No se pudo cargar el casino.");
    }
  }, [id, withAuth]);

  const loadAuction = useCallback(async () => {
    if (!id) return;
    try {
      const { auction } = await withAuth((t) => apiGetAuction(t, id));
      setAuction(auction);
    } catch (err) {
      const e = err as ApiError;
      setLoadError(e.message ?? "No se pudo cargar la subasta.");
    }
  }, [id, withAuth]);

  useEffect(() => {
    loadCasino();
    loadAuction();
  }, [loadCasino, loadAuction]);

  // Poll para ver cuándo un jugador levanta la paleta sin recargar manual.
  usePolling(loadAuction, { intervalMs: POLL_MS, paused: !casino?.subastaActive });

  async function handleSetInitial() {
    const parsed = Number(initialInput.replace(/[^\d]/g, ""));
    if (!Number.isFinite(parsed) || parsed < 100) {
      setActionError("El valor inicial debe ser al menos $100.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const { auction } = await withAuth((t) =>
        apiSetAuctionInitial(t, id!, parsed),
      );
      setAuction(auction);
    } catch (err) {
      const e = err as ApiError;
      setActionError(e.message ?? "No se pudo setear el valor inicial.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAdjust(op: "add" | "mul", factor: number) {
    setActionLoading(true);
    setActionError(null);
    try {
      const { auction } = await withAuth((t) =>
        apiAdjustAuction(t, id!, op, factor),
      );
      setAuction(auction);
    } catch (err) {
      const e = err as ApiError;
      setActionError(e.message ?? "No se pudo ajustar la puja.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReset() {
    setActionLoading(true);
    setActionError(null);
    try {
      const { auction } = await withAuth((t) => apiResetAuction(t, id!));
      setAuction(auction);
    } catch (err) {
      const e = err as ApiError;
      setActionError(e.message ?? "No se pudo reiniciar.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSold() {
    setActionLoading(true);
    setActionError(null);
    try {
      const { auction } = await withAuth((t) => apiMarkAuctionSold(t, id!));
      setAuction(auction);
    } catch (err) {
      const e = err as ApiError;
      setActionError(e.message ?? "No se pudo marcar como vendido.");
    } finally {
      setActionLoading(false);
    }
  }

  const subastaActive = casino?.subastaActive ?? false;
  const currentBid = auction?.currentBid ?? 0;
  const hasInitial = currentBid > 0;
  const hasCurrentBidder = !!auction?.currentBidderAlias;
  const hasLastConfirmed = !!auction?.lastConfirmedBidderAlias;
  const canSell = hasCurrentBidder || hasLastConfirmed;

  return (
    <AdminLayout
      active="casinos"
      title="Subasta"
      subtitle={casino ? casino.name : "Cargando…"}
      breadcrumbs={[
        { to: "/admin/casinos", label: "Casinos" },
        {
          to: id ? `/admin/casinos/${id}` : "/admin/casinos",
          label: casino?.name ?? "Detalle",
        },
        { label: "Subasta" },
      ]}
    >
      <div className="flex flex-col gap-6">
        {loadError && (
          <p
            role="alert"
            className="font-label text-sm tracking-wider text-[--color-carmine-400]"
          >
            {loadError}
          </p>
        )}

        {!subastaActive && casino && (
          <Card tone="night">
            <div className="flex items-center gap-3">
              <Badge tone="danger">subasta inactiva</Badge>
              <p className="text-sm text-[--color-cream]/80">
                Activa el modo subasta desde{" "}
                <Link
                  to="/admin/casinos"
                  className="text-[--color-gold-300] underline"
                >
                  la lista de casinos
                </Link>{" "}
                para operar los controles.
              </p>
            </div>
          </Card>
        )}

        {/* Estado actual — siempre visible, aunque la subasta esté inactiva */}
        <Card tone="night" className="flex flex-col items-center gap-3 py-8">
          <p className="font-label text-[0.7rem] tracking-[0.3em] text-[--color-cream]/60">
            VALOR ACTUAL
          </p>
          {hasInitial ? (
            <Balance amount={currentBid} size="lg" />
          ) : (
            <span className="font-display text-4xl text-[--color-cream]/40">
              —
            </span>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {auction?.currentBidderAlias ? (
              <>
                <Badge tone="gold">pujando</Badge>
                <span className="font-display text-lg text-[--color-ivory]">
                  {auction.currentBidderAlias}
                </span>
              </>
            ) : (
              <Badge tone="neutral">sin paleta en alto</Badge>
            )}
          </div>
          <p className="font-label text-[0.6rem] tracking-[0.3em] text-[--color-cream]/40">
            Ronda #{auction?.roundNumber ?? 1}
          </p>
        </Card>

        {/* Oferta firme previa — queda visible como "si nadie mejora, ésta
            es la buena". Se actualiza cada vez que ajustas el precio y
            había alguien pujando al precio anterior. */}
        {hasLastConfirmed && auction?.lastConfirmedBid !== null && (
          <Card tone="night" className="flex flex-col gap-2 py-5">
            <div className="flex items-center gap-2">
              <Badge tone="info">última oferta en firme</Badge>
              <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
                Si nadie toca el precio actual, ésta se adjudica con "Vendido".
              </p>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="font-display text-2xl text-[--color-ivory]">
                {auction?.lastConfirmedBidderAlias}
              </span>
              <span className="font-display text-xl text-[--color-gold-300]">
                {formatMxn(auction?.lastConfirmedBid ?? 0)}
              </span>
            </div>
          </Card>
        )}

        {/* Último vendido — snapshot histórico para que el anunciador
            sepa qué acaba de cerrar. Se limpia hasta el próximo Vendido. */}
        {auction?.lastSoldBidderAlias && auction.lastSoldBid !== null && (
          <Card tone="night" className="flex flex-col gap-2 py-5">
            <div className="flex items-center gap-2">
              <Badge tone="success">vendido</Badge>
              <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
                Último cierre de ronda.
              </p>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="font-display text-2xl text-[--color-ivory]">
                {auction.lastSoldBidderAlias}
              </span>
              <span className="font-display text-xl text-[--color-gold-300]">
                {formatMxn(auction.lastSoldBid)}
              </span>
            </div>
          </Card>
        )}

        {/* Setear valor inicial */}
        <Card tone="night" className="flex flex-col gap-3">
          <h3 className="font-display text-xl text-[--color-ivory]">
            Valor inicial
          </h3>
          <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
            El piso de la ronda. Al setearlo se limpia la paleta levantada.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              <Input
                label="MXN"
                type="number"
                min={100}
                step={100}
                value={initialInput}
                onChange={(e) => setInitialInput(e.target.value)}
                disabled={!subastaActive || actionLoading}
              />
            </div>
            <Button
              variant="gold"
              onClick={handleSetInitial}
              disabled={!subastaActive || actionLoading}
            >
              Setear piso
            </Button>
          </div>
        </Card>

        {/* Incrementos y multiplicadores */}
        <Card tone="night" className="flex flex-col gap-4">
          <h3 className="font-display text-xl text-[--color-ivory]">
            Ajustar puja
          </h3>
          <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
            Cualquier ajuste limpia la paleta — los jugadores deben volver a
            levantarla al nuevo precio.
          </p>

          <div className="flex flex-col gap-2">
            <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
              INCREMENTOS
            </span>
            <div className="flex flex-wrap gap-2">
              {INCREMENTS.map((inc) => (
                <Button
                  key={inc.factor}
                  variant="primary"
                  size="md"
                  onClick={() => handleAdjust("add", inc.factor)}
                  disabled={!subastaActive || !hasInitial || actionLoading}
                >
                  {inc.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
              MULTIPLICADORES
            </span>
            <div className="flex flex-wrap gap-2">
              {MULTIPLIERS.map((m) => (
                <Button
                  key={m}
                  variant="info"
                  size="md"
                  onClick={() => handleAdjust("mul", m)}
                  disabled={!subastaActive || !hasInitial || actionLoading}
                >
                  x{m}
                  {hasInitial && (
                    <span className="ml-2 font-mono text-xs opacity-80">
                      {formatMxn(currentBid * m)}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Reset + link al display público */}
        <Card tone="night" className="flex flex-col gap-3">
          <h3 className="font-display text-xl text-[--color-ivory]">Controles</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="gold"
              onClick={handleSold}
              disabled={!subastaActive || !canSell || actionLoading}
              title={
                canSell
                  ? undefined
                  : "Necesitas una paleta en alto o una oferta firme previa"
              }
            >
              ¡Vendido!
            </Button>
            <Button
              variant="danger"
              onClick={handleReset}
              disabled={!subastaActive || actionLoading}
            >
              Reiniciar ronda
            </Button>
            {id && (
              <a
                href={`/display/casino/${id}/subasta`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[--color-smoke]/70 px-5 py-2 font-label text-xs tracking-[0.25em] text-[--color-cream]/85 hover:bg-[--color-smoke]/90 hover:text-[--color-ivory]"
              >
                ABRIR DISPLAY PÚBLICO ↗
              </a>
            )}
          </div>
        </Card>

        {actionError && (
          <p
            role="alert"
            className="font-label text-sm tracking-wider text-[--color-carmine-400]"
          >
            {actionError}
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
