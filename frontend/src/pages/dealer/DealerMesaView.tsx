import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Card } from "@/components/atoms/Card";
import { Badge } from "@/components/atoms/Badge";
import { Balance } from "@/components/atoms/Balance";
import { Button } from "@/components/atoms/Button";
import { Tabs, type TabItem } from "@/components/molecules/Tabs";
import { RuletaGameView } from "@/components/organisms/games/RuletaGameView";
import { RuletaReglasContent } from "@/components/organisms/games/RuletaReglasContent";
import { RuletaScoreView } from "@/components/organisms/games/RuletaScoreView";
import { BancaSabeReglasContent } from "@/components/organisms/games/BancaSabeReglasContent";
import { PokerHoldemReglasContent } from "@/components/organisms/games/PokerHoldemReglasContent";
import { BlackjackReglasContent } from "@/components/organisms/games/BlackjackReglasContent";
import { ShowdownReglasContent } from "@/components/organisms/games/ShowdownReglasContent";
import { CubileteReglasContent } from "@/components/organisms/games/CubileteReglasContent";
import { TiraOPagaReglasContent } from "@/components/organisms/games/TiraOPagaReglasContent";
import { YahtzeeReglasContent } from "@/components/organisms/games/YahtzeeReglasContent";
import { DealerPayView } from "@/components/organisms/games/DealerPayView";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/lib/authApi";
import { apiListMyMesas, type MyMesa } from "@/lib/mesaApi";
import {
  apiGetLastRouletteSpin,
  apiRecordRouletteSpin,
  type RouletteSpin,
} from "@/lib/rouletteSpinApi";
import { apiGetMyCasinoSlotWallet } from "@/lib/slotsApi";
import { findGame } from "@/domain/games";
import { usePolling } from "@/hooks/usePolling";

/** Cadence for auto-refresh of the last spin. Kept modest — the UX is
 *  "eventually consistent within a few seconds" and the payload is small. */
const SPIN_POLL_MS = 4000;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

type MesaTab = "juego" | "reglas" | "score" | "pagar";
const MESA_TABS: readonly MesaTab[] = [
  "juego",
  "reglas",
  "score",
  "pagar",
] as const;

function isMesaTab(v: string): v is MesaTab {
  return (MESA_TABS as readonly string[]).includes(v);
}

/**
 * Dealer-side view of a single assigned mesa. The body switches on gameType:
 *   ruleta → tabs [Juego | Reglas | Score] reusing the standalone components
 *   anything else → green-felt placeholder (config lands later)
 *
 * The tab selection lives in the URL (?tab=score) so refreshes and shared
 * links land on the right tab.
 */
export default function DealerMesaView() {
  const { mesaId } = useParams<{ mesaId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [mesa, setMesa] = useState<MyMesa | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [lastSpin, setLastSpin] = useState<RouletteSpin | null>(null);
  const [lastSpinLoading, setLastSpinLoading] = useState(false);
  const [lastSpinError, setLastSpinError] = useState<string | null>(null);

  // Saldo del dealer en este casino (crece con las comisiones del 20% de
  // cada cobro que ejecuta). Se refresca cada 4s igual que el saldo del
  // jugador en PlayerHome — así el dealer ve llegar la comisión en vivo
  // justo después de confirmar un cobro.
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

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

  useEffect(() => {
    if (!mesaId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    // `/me/mesas` returns the caller's assigned mesas only, so it doubles as
    // an authorization check: the dealer can only see mesas that are theirs.
    withAuth((t) => apiListMyMesas(t))
      .then(({ mesas }) => {
        if (cancelled) return;
        const found = mesas.find((m) => m.id === mesaId) ?? null;
        if (!found) {
          setLoadError(
            "Esta mesa no existe o no está asignada a ti actualmente.",
          );
        }
        setMesa(found);
      })
      .catch((err: ApiError) => {
        if (cancelled) return;
        setLoadError(err.message ?? "No se pudo cargar la mesa.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mesaId, withAuth]);

  const casinoId = mesa?.casino.id ?? null;
  const loadBalance = useCallback(async () => {
    if (!casinoId) return;
    setBalanceLoading(true);
    try {
      const wallet = await withAuth((t) =>
        apiGetMyCasinoSlotWallet(t, casinoId),
      );
      setBalance(wallet.balance);
    } catch {
      setBalance((prev) => prev ?? 0);
    } finally {
      setBalanceLoading(false);
    }
  }, [casinoId, withAuth]);

  useEffect(() => {
    if (!casinoId) return;
    loadBalance();
  }, [casinoId, loadBalance]);

  usePolling(loadBalance, {
    intervalMs: 4000,
    paused: !casinoId,
  });

  const refetchLastSpin = useCallback(async () => {
    if (!mesaId) return;
    setLastSpinLoading(true);
    setLastSpinError(null);
    try {
      const { spin } = await withAuth((t) => apiGetLastRouletteSpin(t, mesaId));
      setLastSpin(spin);
    } catch (err) {
      const e = err as ApiError;
      setLastSpinError(e.message ?? "No se pudo consultar el último resultado.");
    } finally {
      setLastSpinLoading(false);
    }
  }, [mesaId, withAuth]);

  // Auto-refresh the last-spin cache while the mesa is ruleta. The poll is
  // paused on other game types (wasted bytes) and while the tab is hidden
  // (handled inside the hook). The cache is shared with the Score tab so
  // switching tabs never waits on a fetch.
  usePolling(refetchLastSpin, {
    intervalMs: SPIN_POLL_MS,
    paused: !mesa || mesa.gameType !== "ruleta",
  });

  async function handleSpinComplete(patternId: string) {
    if (!mesaId) return;
    try {
      const { spin } = await withAuth((t) =>
        apiRecordRouletteSpin(t, mesaId, patternId),
      );
      // Update local cache so the Score tab is ready the moment the user
      // switches — no extra network round-trip needed.
      setLastSpin(spin);
      setLastSpinError(null);
    } catch (err) {
      const e = err as ApiError;
      console.warn("[dealer] could not persist roulette spin:", e);
      // Leave the UI as-is; the game already showed the modal. The next
      // automatic refetch (e.g. reload) will reconcile.
    }
  }

  if (!mesaId) return <Navigate to="/dealer" replace />;

  const game = mesa ? findGame(mesa.gameType) : null;
  const gameLabel = game?.name ?? mesa?.gameType ?? "";

  const isRuleta = mesa?.gameType === "ruleta";
  // Juegos que tienen reglas pero no jugabilidad digital — sólo muestran
  // el tab "Reglas" (más el "Pagar" universal).
  const isReglasOnly =
    mesa?.gameType === "la_banca_sabe" ||
    mesa?.gameType === "poker_holdem" ||
    mesa?.gameType === "blackjack" ||
    mesa?.gameType === "showdown" ||
    mesa?.gameType === "cubilete" ||
    mesa?.gameType === "tira_o_paga" ||
    mesa?.gameType === "yahtzee";
  // Tab por defecto por juego: ruleta abre en "juego"; los reglas-only
  // abren en "reglas"; el resto en "pagar".
  const defaultTab: MesaTab = isRuleta
    ? "juego"
    : isReglasOnly
      ? "reglas"
      : "pagar";

  const urlTab = searchParams.get("tab");
  const activeTab: MesaTab =
    urlTab && isMesaTab(urlTab) ? urlTab : defaultTab;

  function setActiveTab(next: MesaTab) {
    if (next === defaultTab) {
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", next);
    }
    setSearchParams(searchParams, { replace: true });
  }

  // "Pagar" es universal: cualquier mesa puede usarlo para depositar a
  // jugadores del roster del casino. Los demás tabs dependen del juego.
  const tabItems: TabItem<MesaTab>[] = [
    ...(isRuleta
      ? ([
          { value: "juego", label: "Juego" },
          { value: "reglas", label: "Reglas" },
          { value: "score", label: "Score" },
        ] as TabItem<MesaTab>[])
      : isReglasOnly
        ? ([{ value: "reglas", label: "Reglas" }] as TabItem<MesaTab>[])
        : []),
    { value: "pagar", label: "Pagar" },
  ];

  return (
    <div className="min-h-full pb-10">
      <header className="bg-[--color-felt-900]/75 backdrop-blur-sm px-4 py-4 sm:px-8 lg:px-10 shadow-[inset_0_-1px_0_var(--color-gold-500),0_2px_12px_-2px_rgba(212,175,55,0.25)]">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <BackButton onClick={() => navigate("/dealer")} />
          <div className="min-w-0 flex-1">
            <h1 className="gold-shine font-display text-2xl leading-tight sm:text-3xl md:text-4xl">
              {mesa ? gameLabel : loading ? "Cargando…" : "Mesa"}
            </h1>
            {mesa && (
              <p className="mt-1 font-label text-xs tracking-widest text-[--color-cream]/60">
                {mesa.casino.name} · {formatDate(mesa.casino.date)}
              </p>
            )}
          </div>
          {mesa && (
            <Tabs<MesaTab>
              items={tabItems}
              value={activeTab}
              onChange={setActiveTab}
              accent={() => "felt"}
            />
          )}
        </div>
      </header>

      <main className="px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
        {loadError && (
          <Card tone="night" style={{ marginInline: 0 }}>
            <p
              className="font-label text-sm tracking-wider text-[--color-carmine-400]"
              role="alert"
            >
              {loadError}
            </p>
            <div className="mt-4">
              <Link
                to="/dealer"
                className="font-label text-xs tracking-widest text-[--color-gold-300] hover:text-[--color-gold-400]"
              >
                Regresar al panel →
              </Link>
            </div>
          </Card>
        )}

        {!loadError && mesa && (
          <MesaBody
            mesa={mesa}
            tab={activeTab}
            onSpinComplete={handleSpinComplete}
            lastSpin={lastSpin}
            lastSpinLoading={lastSpinLoading}
            lastSpinError={lastSpinError}
            balance={balance}
            balanceLoading={balanceLoading}
            onRefreshBalance={loadBalance}
          />
        )}
      </main>
    </div>
  );
}

/**
 * Circular back-arrow used in the mesa topbar. Visual matches the mute/back
 * buttons in the juegos pages so the project has one consistent round nav
 * affordance.
 */
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Volver al panel"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[--color-gold-500]/40 bg-[--color-smoke]/70 text-lg leading-none text-[--color-cream]/85 transition hover:border-[--color-gold-400] hover:text-[--color-ivory] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400]"
    >
      ←
    </button>
  );
}

type MesaBodyProps = {
  mesa: MyMesa;
  tab: MesaTab;
  onSpinComplete: (patternId: string) => Promise<void>;
  lastSpin: RouletteSpin | null;
  lastSpinLoading: boolean;
  lastSpinError: string | null;
  balance: number | null;
  balanceLoading: boolean;
  onRefreshBalance: () => void;
};

/**
 * Renders the current tab's content (tabs themselves live in the topbar).
 * Switch-per-gameType: add a new branch when wiring a non-ruleta mesa.
 */
function MesaBody({
  mesa,
  tab,
  onSpinComplete,
  lastSpin,
  lastSpinLoading,
  lastSpinError,
  balance,
  balanceLoading,
  onRefreshBalance,
}: MesaBodyProps) {
  const balanceCard = (
    <Card
      tone="night"
      className="mb-6 flex flex-col items-center gap-3 py-6"
      style={{ marginInline: 0 }}
    >
      <p className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/60">
        MI SALDO EN ESTE CASINO
      </p>
      {balanceLoading && balance === null ? (
        <span className="font-display text-3xl text-[--color-cream]/40">…</span>
      ) : (
        <Balance amount={balance ?? 0} size="lg" />
      )}
      <p className="font-label text-[0.6rem] tracking-[0.25em] text-[--color-cream]/55 text-center">
        Acumulado por comisiones del 20% en cada cobro a jugadores.
        Úsalo para pujar durante la subasta.
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefreshBalance}
        disabled={balanceLoading}
        aria-label="Actualizar saldo"
        title="Refrescar saldo"
      >
        {balanceLoading ? "Actualizando…" : "↻ Actualizar"}
      </Button>
    </Card>
  );
  const archivedBanner = useMemo(() => {
    if (!mesa.casino.active) {
      return (
        <Card tone="night" className="mb-6" style={{ marginInline: 0 }}>
          <div className="flex items-center gap-3">
            <Badge tone="danger">casino archivado</Badge>
            <p className="text-sm text-[--color-cream]/80">
              Este casino está archivado. No deberías operar la mesa hasta que
              sea reactivado.
            </p>
          </div>
        </Card>
      );
    }
    if (!mesa.active) {
      return (
        <Card tone="night" className="mb-6" style={{ marginInline: 0 }}>
          <div className="flex items-center gap-3">
            <Badge tone="danger">mesa archivada</Badge>
            <p className="text-sm text-[--color-cream]/80">
              Esta mesa está archivada. No deberías operarla hasta que sea
              reactivada.
            </p>
          </div>
        </Card>
      );
    }
    if (mesa.casino.subastaActive) {
      return (
        <Card tone="night" className="mb-6" style={{ marginInline: 0 }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Badge tone="gold">subasta activa</Badge>
              <p className="text-sm text-[--color-cream]/80">
                Mientras dure la subasta, los cobros/pagos están suspendidos.
                Puedes participar con tu saldo de comisiones.
              </p>
            </div>
            <Link
              to={`/player/casino/${mesa.casino.id}/subasta`}
              className="shrink-0 rounded-full border border-[--color-gold-500]/40 bg-[--color-smoke]/70 px-4 py-2 font-label text-xs tracking-[0.25em] text-[--color-gold-300] hover:border-[--color-gold-400] hover:text-[--color-ivory]"
            >
              Ir a la subasta →
            </Link>
          </div>
        </Card>
      );
    }
    return null;
  }, [mesa]);

  const canDeposit = mesa.casino.active && mesa.active;

  if (tab === "pagar") {
    return (
      <>
        {archivedBanner}
        {balanceCard}
        <DealerPayView casinoId={mesa.casino.id} canDeposit={canDeposit} />
      </>
    );
  }

  if (mesa.gameType === "la_banca_sabe") {
    return (
      <>
        {archivedBanner}
        {balanceCard}
        {tab === "reglas" && <BancaSabeReglasContent />}
      </>
    );
  }

  if (mesa.gameType === "poker_holdem") {
    return (
      <>
        {archivedBanner}
        {balanceCard}
        {tab === "reglas" && <PokerHoldemReglasContent />}
      </>
    );
  }

  if (mesa.gameType === "blackjack") {
    return (
      <>
        {archivedBanner}
        {balanceCard}
        {tab === "reglas" && <BlackjackReglasContent />}
      </>
    );
  }

  if (mesa.gameType === "showdown") {
    return (
      <>
        {archivedBanner}
        {balanceCard}
        {tab === "reglas" && <ShowdownReglasContent />}
      </>
    );
  }

  if (mesa.gameType === "cubilete") {
    return (
      <>
        {archivedBanner}
        {balanceCard}
        {tab === "reglas" && <CubileteReglasContent />}
      </>
    );
  }

  if (mesa.gameType === "tira_o_paga") {
    return (
      <>
        {archivedBanner}
        {balanceCard}
        {tab === "reglas" && <TiraOPagaReglasContent />}
      </>
    );
  }

  if (mesa.gameType === "yahtzee") {
    return (
      <>
        {archivedBanner}
        {balanceCard}
        {tab === "reglas" && <YahtzeeReglasContent />}
      </>
    );
  }

  if (mesa.gameType !== "ruleta") {
    return (
      <>
        {archivedBanner}
        {balanceCard}
        <GamePlaceholder />
      </>
    );
  }

  return (
    <>
      {archivedBanner}
      {balanceCard}
      {tab === "juego" && <RuletaGameView onSpinComplete={onSpinComplete} />}
      {tab === "reglas" && <RuletaReglasContent hideDigitalCTA />}
      {tab === "score" && (
        <RuletaScoreView
          spin={lastSpin}
          loading={lastSpinLoading}
          error={lastSpinError}
        />
      )}
    </>
  );
}

function GamePlaceholder() {
  return (
    <div
      className="relative flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-[--color-gold-500]/20 bg-gradient-to-b from-[--color-felt-700] to-[--color-felt-800] p-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
      style={{ backgroundImage: "var(--felt-weave)" }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-[--color-gold-500]/30" />
      <p className="gold-shine font-display text-2xl sm:text-3xl">
        Esta mesa aún no tiene configuración
      </p>
      <p className="mt-3 max-w-md font-label text-xs tracking-widest text-[--color-cream]/70 sm:text-sm">
        Próximamente podrás operarla desde aquí junto con sus reglas y
        herramientas específicas del juego.
      </p>
    </div>
  );
}
