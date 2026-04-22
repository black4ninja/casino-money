import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore, verifyStoredSession } from "@/stores/authStore";
import Login from "./pages/Login";
import Ingest from "./pages/Ingest";
import Simulator from "./pages/Simulator";
import Juegos from "./pages/juegos/Juegos";
import Ruleta from "./pages/juegos/Ruleta";
import AdminSession from "./pages/admin/AdminSession";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminCaja from "./pages/admin/AdminCaja";
import AdminRoster from "./pages/admin/AdminRoster";
import AdminUsers from "./pages/admin/AdminUsers";
import PlayerDashboard from "./pages/player/PlayerDashboard";
import PlayerHome from "./pages/player/PlayerHome";
import PlayerWallet from "./pages/player/PlayerWallet";
import PlayerIdentity from "./pages/player/PlayerIdentity";
import PlayerReceive from "./pages/player/PlayerReceive";
import PlayerPay from "./pages/player/PlayerPay";
import PlayerTransfer from "./pages/player/PlayerTransfer";
import PlayerHistory from "./pages/player/PlayerHistory";
import DealerHome from "./pages/dealer/DealerHome";
import DealerLogin from "./pages/dealer/DealerLogin";
import DealerMenu from "./pages/dealer/DealerMenu";
import DealerEmit from "./pages/dealer/DealerEmit";
import DealerRedeem from "./pages/dealer/DealerRedeem";
import DealerDashboard from "./pages/dealer/DealerDashboard";
import { ProtectedRoute } from "@/components/templates/ProtectedRoute";

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
    // Validate the stored session against the backend; if invalid → clear it.
    verifyStoredSession().catch(() => {});
  }, [hydrate]);

  return (
    <Routes>
      {/* Public entry */}
      <Route path="/" element={<Login />} />
      <Route path="/ingest" element={<Ingest />} />
      <Route path="/dev" element={<Simulator />} />
      <Route path="/juegos" element={<Juegos />} />
      <Route path="/juegos/ruleta" element={<Ruleta />} />

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

      {/* Casino-session management — unprotected per current scope. */}
      <Route path="/admin/session" element={<AdminSession />} />
      <Route path="/admin/overview" element={<AdminOverview />} />
      <Route path="/admin/caja" element={<AdminCaja />} />
      <Route path="/admin/roster" element={<AdminRoster />} />

      {/* Player area — master may also access. */}
      <Route
        path="/player"
        element={
          <ProtectedRoute allowedRoles={["player", "master"]}>
            <PlayerDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/player/home" element={<PlayerHome />} />
      <Route path="/player/wallet" element={<PlayerWallet />} />
      <Route path="/player/identity" element={<PlayerIdentity />} />
      <Route path="/player/receive" element={<PlayerReceive />} />
      <Route path="/player/pay" element={<PlayerPay />} />
      <Route path="/player/transfer" element={<PlayerTransfer />} />
      <Route path="/player/history" element={<PlayerHistory />} />

      {/* Dealer area — master may also access (role hierarchy). */}
      <Route
        path="/dealer"
        element={
          <ProtectedRoute allowedRoles={["dealer", "master"]}>
            <DealerHome />
          </ProtectedRoute>
        }
      />
      <Route path="/dealer/login" element={<DealerLogin />} />
      <Route path="/dealer/menu" element={<DealerMenu />} />
      <Route path="/dealer/emit" element={<DealerEmit />} />
      <Route path="/dealer/redeem" element={<DealerRedeem />} />
      <Route path="/dealer/stats" element={<DealerDashboard />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
