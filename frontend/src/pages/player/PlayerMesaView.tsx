import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Badge } from "@/components/atoms/Badge";
import { Tabs, type TabItem } from "@/components/molecules/Tabs";
import { RuletaReglasContent } from "@/components/organisms/games/RuletaReglasContent";
import { RuletaScoreView } from "@/components/organisms/games/RuletaScoreView";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/lib/authApi";
import { apiListMyCasinoMesas, type Mesa } from "@/lib/mesaApi";
import { apiListMyCasinos, type Casino } from "@/lib/casinoApi";
import {
  apiGetMyCasinoMesaLastSpin,
  type RouletteSpin,
} from "@/lib/rouletteSpinApi";
import { findGame } from "@/domain/games";
import { usePolling } from "@/hooks/usePolling";

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

type RuletaTab = "score" | "reglas";
const RULETA_TABS: readonly RuletaTab[] = ["score", "reglas"] as const;
function isRuletaTab(v: string): v is RuletaTab {
  return (RULETA_TABS as readonly string[]).includes(v);
}

/**
 * Player-side view of a single mesa inside a casino they have access to.
 * Intentionally narrower than DealerMesaView: the wheel itself is NOT
 * shown here because the player is not the operator — a local demo wheel
 * would be confusing and mislead them into thinking it drives the actual
 * game. What the player does need:
 *   - Score — the most recent spin the dealer recorded (polled live).
 *   - Reglas — how the game works, in case they want to consult during
 *     the round.
 * Access is verified by listing the player's allowed mesas for the casino
 * in the URL, instead of `/me/mesas` (which scopes to dealer assignments).
 */
export default function PlayerMesaView() {
  const { casinoId, mesaId } = useParams<{
    casinoId: string;
    mesaId: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [casino, setCasino] = useState<Casino | null>(null);
  const [mesa, setMesa] = useState<Mesa | null>(null);
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

  // Verify access: the mesa must live inside a casino the caller is
  // allowed into. Both lookups are already scoped to the caller, so this
  // doubles as authorization.
  useEffect(() => {
    if (!casinoId || !mesaId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const [{ casinos }, { mesas }] = await Promise.all([
          withAuth((t) => apiListMyCasinos(t)),
          withAuth((t) => apiListMyCasinoMesas(t, casinoId)),
        ]);
        if (cancelled) return;
        const foundCasino = casinos.find((c) => c.id === casinoId) ?? null;
        const foundMesa = mesas.find((m) => m.id === mesaId) ?? null;
        if (!foundCasino || !foundMesa) {
          setLoadError(
            "Esta mesa no está disponible para ti en este momento.",
          );
          setCasino(null);
          setMesa(null);
          return;
        }
        setCasino(foundCasino);
        setMesa(foundMesa);
      } catch (err) {
        if (cancelled) return;
        const e = err as ApiError;
        setLoadError(e.message ?? "No se pudo cargar la mesa.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [casinoId, mesaId, withAuth]);

  const refetchLastSpin = useCallback(async () => {
    if (!casinoId || !mesaId || !mesa || mesa.gameType !== "ruleta") return;
    setLastSpinLoading(true);
    setLastSpinError(null);
    try {
      const { spin } = await withAuth((t) =>
        apiGetMyCasinoMesaLastSpin(t, casinoId, mesaId),
      );
      setLastSpin(spin);
    } catch (err) {
      const e = err as ApiError;
      setLastSpinError(e.message ?? "No se pudo consultar el último resultado.");
    } finally {
      setLastSpinLoading(false);
    }
  }, [casinoId, mesaId, mesa, withAuth]);

  // Keep the player's Score tab fresh — the dealer may spin while the
  // player is watching. Pause for non-ruleta mesas and while hidden.
  usePolling(refetchLastSpin, {
    intervalMs: SPIN_POLL_MS,
    paused: !mesa || mesa.gameType !== "ruleta",
  });

  if (!casinoId || !mesaId) return <Navigate to="/player" replace />;

  const game = mesa ? findGame(mesa.gameType) : null;
  const gameLabel = game?.name ?? mesa?.gameType ?? "";

  const urlTab = searchParams.get("tab");
  const activeTab: RuletaTab =
    urlTab && isRuletaTab(urlTab) ? urlTab : "score";

  function setActiveTab(next: RuletaTab) {
    // `score` is the default, so we keep the URL clean by omitting it.
    if (next === "score") {
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", next);
    }
    setSearchParams(searchParams, { replace: true });
  }

  const isRuleta = mesa?.gameType === "ruleta";
  const tabItems: TabItem<RuletaTab>[] = [
    { value: "score", label: "Score" },
    { value: "reglas", label: "Reglas" },
  ];

  const backHref = `/player/casino/${casinoId}`;

  return (
    <AppLayout
      title={mesa ? gameLabel : loading ? "Cargando…" : "Mesa"}
      subtitle={casino ? `${casino.name} · ${formatDate(casino.date)}` : undefined}
      back={{ to: backHref, label: "Mesas del casino" }}
      right={
        isRuleta ? (
          <Tabs<RuletaTab>
            items={tabItems}
            value={activeTab}
            onChange={setActiveTab}
            accent={() => "felt"}
          />
        ) : undefined
      }
    >
      {loadError && (
        <Card tone="night">
          <p
            className="font-label text-sm tracking-wider text-[--color-carmine-400]"
            role="alert"
          >
            {loadError}
          </p>
          <div className="mt-4">
            <Link
              to={backHref}
              className="font-label text-xs tracking-widest text-[--color-gold-300] hover:text-[--color-gold-400]"
            >
              ← Volver a las mesas
            </Link>
          </div>
        </Card>
      )}

      {!loadError && mesa && casino && (
        <MesaBody
          mesa={mesa}
          casinoActive={casino.active && casino.exists}
          tab={activeTab}
          lastSpin={lastSpin}
          lastSpinLoading={lastSpinLoading}
          lastSpinError={lastSpinError}
        />
      )}

      {/* Mobile fallback for the tabs — on narrow screens AppLayout's right
          slot wraps below the header; we also surface tabs inline so the
          flow stays one-column readable. */}
    </AppLayout>
  );
}

type MesaBodyProps = {
  mesa: Mesa;
  casinoActive: boolean;
  tab: RuletaTab;
  lastSpin: RouletteSpin | null;
  lastSpinLoading: boolean;
  lastSpinError: string | null;
};

function MesaBody({
  mesa,
  casinoActive,
  tab,
  lastSpin,
  lastSpinLoading,
  lastSpinError,
}: MesaBodyProps) {
  const archivedBanner = useMemo(() => {
    if (!casinoActive) {
      return (
        <Card tone="night" className="mb-6" style={{ marginInline: 0 }}>
          <div className="flex items-center gap-3">
            <Badge tone="danger">casino archivado</Badge>
            <p className="text-sm text-[--color-cream]/80">
              Este casino está archivado. Espera a que el maestro lo reactive
              antes de jugar.
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
              Esta mesa está archivada por ahora.
            </p>
          </div>
        </Card>
      );
    }
    return null;
  }, [mesa, casinoActive]);

  if (mesa.gameType !== "ruleta") {
    return (
      <>
        {archivedBanner}
        <Card tone="felt" className="text-center" style={{ marginInline: 0 }}>
          <p className="gold-shine font-display text-2xl sm:text-3xl">
            Esta mesa aún no tiene vista para jugadores
          </p>
          <p className="mt-2 max-w-md font-label text-xs tracking-widest text-[--color-cream]/70">
            Próximamente podrás seguir el juego desde aquí.
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      {archivedBanner}
      {tab === "score" && (
        <RuletaScoreView
          spin={lastSpin}
          loading={lastSpinLoading}
          error={lastSpinError}
          viewerIsPlayer
        />
      )}
      {tab === "reglas" && <RuletaReglasContent hideDigitalCTA />}
    </>
  );
}
