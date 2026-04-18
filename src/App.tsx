import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Ingest from "./pages/Ingest";
import AdminSession from "./pages/admin/AdminSession";
import AdminOverview from "./pages/admin/AdminOverview";
import PlayerHome from "./pages/player/PlayerHome";
import PlayerWallet from "./pages/player/PlayerWallet";
import PlayerIdentity from "./pages/player/PlayerIdentity";
import PlayerReceive from "./pages/player/PlayerReceive";
import PlayerPay from "./pages/player/PlayerPay";
import PlayerTransfer from "./pages/player/PlayerTransfer";
import PlayerHistory from "./pages/player/PlayerHistory";
import DealerLogin from "./pages/dealer/DealerLogin";
import DealerMenu from "./pages/dealer/DealerMenu";
import DealerEmit from "./pages/dealer/DealerEmit";
import DealerRedeem from "./pages/dealer/DealerRedeem";
import DealerDashboard from "./pages/dealer/DealerDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/ingest" element={<Ingest />} />

      <Route path="/admin" element={<AdminSession />} />
      <Route path="/admin/overview" element={<AdminOverview />} />

      <Route path="/player" element={<PlayerHome />} />
      <Route path="/player/wallet" element={<PlayerWallet />} />
      <Route path="/player/identity" element={<PlayerIdentity />} />
      <Route path="/player/receive" element={<PlayerReceive />} />
      <Route path="/player/pay" element={<PlayerPay />} />
      <Route path="/player/transfer" element={<PlayerTransfer />} />
      <Route path="/player/history" element={<PlayerHistory />} />

      <Route path="/dealer" element={<DealerLogin />} />
      <Route path="/dealer/menu" element={<DealerMenu />} />
      <Route path="/dealer/emit" element={<DealerEmit />} />
      <Route path="/dealer/redeem" element={<DealerRedeem />} />
      <Route path="/dealer/dashboard" element={<DealerDashboard />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
