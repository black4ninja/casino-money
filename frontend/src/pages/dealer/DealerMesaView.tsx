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
import { Tabs, type TabItem } from "@/components/molecules/Tabs";
import { RuletaGameView } from "@/components/organisms/games/RuletaGameView";
import { RuletaReglasContent } from "@/components/organisms/games/RuletaReglasContent";
import { RuletaScoreView } from "@/components/organisms/games/RuletaScoreView";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/lib/authApi";
import { apiListMyMesas, type MyMesa } from "@/lib/mesaApi";
import {
  apiGetLastRouletteSpin,
  apiRecordRouletteSpin,
  type RouletteSpin,
} from "@/lib/rouletteSpinApi";
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

type RuletaTab = "juego" | "reglas" | "score";
const RULETA_TABS: readonly RuletaTab[] = ["juego", "reglas", "score"] as const;

function isRuletaTab(v: string): v is RuletaTab {
  return (RULETA_TABS as readonly string[]).includes(v);
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

  const urlTab = searchParams.get("tab");
  const activeTab: RuletaTab =
    urlTab && isRuletaTab(urlTab) ? urlTab : "juego";

  function setActiveTab(next: RuletaTab) {
    if (next === "juego") {
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", next);
    }
    setSearchParams(searchParams, { replace: true });
  }

  const isRuleta = mesa?.gameType === "ruleta";
  const tabItems: TabItem<RuletaTab>[] = [
    { value: "juego", label: "Juego" },
    { value: "reglas", label: "Reglas" },
    { value: "score", label: "Score" },
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
          {isRuleta && (
            <Tabs<RuletaTab>
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
  tab: RuletaTab;
  onSpinComplete: (patternId: string) => Promise<void>;
  lastSpin: RouletteSpin | null;
  lastSpinLoading: boolean;
  lastSpinError: string | null;
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
}: MesaBodyProps) {
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
    return null;
  }, [mesa]);

  if (mesa.gameType !== "ruleta") {
    return (
      <>
        {archivedBanner}
        <GamePlaceholder />
      </>
    );
  }

  return (
    <>
      {archivedBanner}
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
