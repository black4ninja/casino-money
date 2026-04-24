import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore, verifyStoredSession } from "@/stores/authStore";
import Login from "./pages/Login";
import { ProtectedRoute } from "@/components/templates/ProtectedRoute";
import { DealerShell } from "@/components/templates/DealerShell";
import { PlayerShell } from "@/components/templates/PlayerShell";

// Everything except the Login screen is lazy — the first paint only has to
// parse the landing + router + vendor core. Each role's pages ship in their
// own chunk on demand so a player never pays for admin code (and vice versa).
const Ingest = lazy(() => import("./pages/Ingest"));
const Simulator = lazy(() => import("./pages/Simulator"));
const Juegos = lazy(() => import("./pages/juegos/Juegos"));
const Ruleta = lazy(() => import("./pages/juegos/Ruleta"));
const RuletaReglas = lazy(() => import("./pages/juegos/RuletaReglas"));
const BancaSabeReglas = lazy(() => import("./pages/juegos/BancaSabeReglas"));
const PokerHoldemReglas = lazy(() => import("./pages/juegos/PokerHoldemReglas"));
const BlackjackReglas = lazy(() => import("./pages/juegos/BlackjackReglas"));
const ShowdownReglas = lazy(() => import("./pages/juegos/ShowdownReglas"));
const CubileteReglas = lazy(() => import("./pages/juegos/CubileteReglas"));
const TiraOPagaReglas = lazy(() => import("./pages/juegos/TiraOPagaReglas"));
const YahtzeeReglas = lazy(() => import("./pages/juegos/YahtzeeReglas"));
const DisplayCarrera = lazy(() => import("./pages/display/DisplayCarrera"));
const DisplaySubasta = lazy(() => import("./pages/display/DisplaySubasta"));

const AdminSession = lazy(() => import("./pages/admin/AdminSession"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminCaja = lazy(() => import("./pages/admin/AdminCaja"));
const AdminRoster = lazy(() => import("./pages/admin/AdminRoster"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminCasinos = lazy(() => import("./pages/admin/AdminCasinos"));
const AdminCasinoDetail = lazy(() => import("./pages/admin/AdminCasinoDetail"));
const AdminCasinoEconomy = lazy(() =>
  import("./pages/admin/AdminCasinoEconomy"),
);
const AdminCasinoSubasta = lazy(() =>
  import("./pages/admin/AdminCasinoSubasta"),
);

const PlayerDashboard = lazy(() => import("./pages/player/PlayerDashboard"));
const PlayerHome = lazy(() => import("./pages/player/PlayerHome"));
const PlayerMesaView = lazy(() => import("./pages/player/PlayerMesaView"));
const PlayerSlots = lazy(() => import("./pages/player/PlayerSlots"));
const PlayerCarrera = lazy(() => import("./pages/player/PlayerCarrera"));
const PlayerWallet = lazy(() => import("./pages/player/PlayerWallet"));
const PlayerIdentity = lazy(() => import("./pages/player/PlayerIdentity"));
const PlayerReceive = lazy(() => import("./pages/player/PlayerReceive"));
const PlayerPay = lazy(() => import("./pages/player/PlayerPay"));
const PlayerTransfer = lazy(() => import("./pages/player/PlayerTransfer"));
const PlayerSubasta = lazy(() => import("./pages/player/PlayerSubasta"));
const PlayerHistory = lazy(() => import("./pages/player/PlayerHistory"));

const DealerHome = lazy(() => import("./pages/dealer/DealerHome"));
const DealerLogin = lazy(() => import("./pages/dealer/DealerLogin"));
const DealerMenu = lazy(() => import("./pages/dealer/DealerMenu"));
const DealerEmit = lazy(() => import("./pages/dealer/DealerEmit"));
const DealerRedeem = lazy(() => import("./pages/dealer/DealerRedeem"));
const DealerDashboard = lazy(() => import("./pages/dealer/DealerDashboard"));
const DealerMesaView = lazy(() => import("./pages/dealer/DealerMesaView"));

/**
 * Suspense fallback rendered between lazy route swaps. Kept minimal on
 * purpose: a full-viewport centered spinner would flash noticeably on fast
 * networks; this quiet felt backdrop reads as a transition, not a loading
 * state, and doesn't stutter the eye.
 */
function RouteLoader() {
  return (
    <div
      aria-hidden
      className="flex min-h-screen items-center justify-center bg-[--color-felt-900]"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[--color-gold-500]/30 border-t-[--color-gold-400]" />
    </div>
  );
}

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
    // Validate the stored session against the backend; if invalid → clear it.
    verifyStoredSession().catch(() => {});
  }, [hydrate]);

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Public entry — NOT lazy so first paint has no suspense fallback. */}
        <Route path="/" element={<Login />} />
        <Route path="/ingest" element={<Ingest />} />
        <Route path="/dev" element={<Simulator />} />
        <Route path="/juegos" element={<Juegos />} />
        <Route path="/juegos/ruleta" element={<Ruleta />} />
        <Route path="/juegos/ruleta/reglas" element={<RuletaReglas />} />
        <Route path="/juegos/banca-sabe/reglas" element={<BancaSabeReglas />} />
        <Route path="/juegos/poker-holdem/reglas" element={<PokerHoldemReglas />} />
        <Route path="/juegos/blackjack/reglas" element={<BlackjackReglas />} />
        <Route path="/juegos/showdown/reglas" element={<ShowdownReglas />} />
        <Route path="/juegos/cubilete/reglas" element={<CubileteReglas />} />
        <Route path="/juegos/tira-o-paga/reglas" element={<TiraOPagaReglas />} />
        <Route path="/juegos/yahtzee/reglas" element={<YahtzeeReglas />} />
        {/* Proyección pública de la Carrera de Patrones — sin auth. */}
        <Route path="/display/casino/:casinoId/carrera" element={<DisplayCarrera />} />
        {/* Proyección pública de la subasta — sin auth. */}
        <Route path="/display/casino/:casinoId/subasta" element={<DisplaySubasta />} />

        {/* Master admin panel (auth required) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["master"]}>
              <Navigate to="/admin/users" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["master"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/casinos"
          element={
            <ProtectedRoute allowedRoles={["master"]}>
              <AdminCasinos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/casinos/:id"
          element={
            <ProtectedRoute allowedRoles={["master"]}>
              <AdminCasinoDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/casinos/:id/economy"
          element={
            <ProtectedRoute allowedRoles={["master"]}>
              <AdminCasinoEconomy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/casinos/:id/subasta"
          element={
            <ProtectedRoute allowedRoles={["master"]}>
              <AdminCasinoSubasta />
            </ProtectedRoute>
          }
        />

        {/* Casino-session management — unprotected per current scope. */}
        <Route path="/admin/session" element={<AdminSession />} />
        <Route path="/admin/overview" element={<AdminOverview />} />
        <Route path="/admin/caja" element={<AdminCaja />} />
        <Route path="/admin/roster" element={<AdminRoster />} />

        {/* Player area — master may also access. PlayerShell renders the
            handbook FAB + modal on every /player/* route so the pocket
            reference is always one tap away. Legacy /player/home still
            bounces to /player. */}
        <Route path="/player/home" element={<Navigate to="/player" replace />} />
        <Route element={<PlayerShell />}>
          <Route
            path="/player"
            element={
              <ProtectedRoute allowedRoles={["player", "master"]}>
                <PlayerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/casino/:casinoId"
            element={
              <ProtectedRoute allowedRoles={["player", "master"]}>
                <PlayerHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/casino/:casinoId/mesa/:mesaId"
            element={
              <ProtectedRoute allowedRoles={["player", "master"]}>
                <PlayerMesaView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/casino/:casinoId/slots"
            element={
              <ProtectedRoute allowedRoles={["player", "dealer", "master"]}>
                <PlayerSlots />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/casino/:casinoId/carrera"
            element={
              <ProtectedRoute allowedRoles={["player", "dealer", "master"]}>
                <PlayerCarrera />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/casino/:casinoId/subasta"
            element={
              <ProtectedRoute allowedRoles={["player", "dealer", "master"]}>
                <PlayerSubasta />
              </ProtectedRoute>
            }
          />
          <Route path="/player/wallet" element={<PlayerWallet />} />
          <Route path="/player/identity" element={<PlayerIdentity />} />
          <Route path="/player/receive" element={<PlayerReceive />} />
          <Route path="/player/pay" element={<PlayerPay />} />
          <Route path="/player/transfer" element={<PlayerTransfer />} />
          <Route path="/player/history" element={<PlayerHistory />} />
        </Route>

        {/* Dealer area — nested under DealerShell so every /dealer/* page
            inherits the landing-style background. Master may also access
            per the role hierarchy. */}
        <Route path="/dealer" element={<DealerShell />}>
          <Route
            index
            element={
              <ProtectedRoute allowedRoles={["dealer", "master"]}>
                <DealerHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="mesa/:mesaId"
            element={
              <ProtectedRoute allowedRoles={["dealer", "master"]}>
                <DealerMesaView />
              </ProtectedRoute>
            }
          />
          <Route path="login" element={<DealerLogin />} />
          <Route path="menu" element={<DealerMenu />} />
          <Route path="emit" element={<DealerEmit />} />
          <Route path="redeem" element={<DealerRedeem />} />
          <Route path="stats" element={<DealerDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
