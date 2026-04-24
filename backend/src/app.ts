import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath, join as joinPath } from "node:path";
import { existsSync } from "node:fs";
import type { Env } from "./config/env.js";
import { buildParseServer } from "./infrastructure/parse/parseServer.js";
import { initParseClient } from "./infrastructure/parse/parseClient.js";
import { apiRoutes } from "./interfaces/http/routes/index.js";
import { authRoutes } from "./interfaces/http/routes/auth.routes.js";
import { userRoutes } from "./interfaces/http/routes/users.routes.js";
import { casinoRoutes } from "./interfaces/http/routes/casinos.routes.js";
import { mesaRoutes } from "./interfaces/http/routes/mesas.routes.js";
import { meRoutes } from "./interfaces/http/routes/me.routes.js";
import { rouletteSpinRoutes } from "./interfaces/http/routes/roulette-spins.routes.js";
import { economyRoutes } from "./interfaces/http/routes/economy.routes.js";
import { slotsRoutes } from "./interfaces/http/routes/slots.routes.js";
import { errorHandler } from "./interfaces/http/middlewares/errorHandler.js";
import { requireAuth } from "./interfaces/http/middlewares/requireAuth.js";
import { requireRole } from "./interfaces/http/middlewares/requireRole.js";
import { requireCasinoEconomyAccess } from "./interfaces/http/middlewares/requireCasinoEconomyAccess.js";
import { ParseAppUserRepo } from "./infrastructure/parse/repositories/AppUserRepo.js";
import { ParseAppSessionRepo } from "./infrastructure/parse/repositories/AppSessionRepo.js";
import { ParseCasinoRepo } from "./infrastructure/parse/repositories/CasinoRepo.js";
import { ParseMesaRepo } from "./infrastructure/parse/repositories/MesaRepo.js";
import { ParseRouletteSpinRepo } from "./infrastructure/parse/repositories/RouletteSpinRepo.js";
import { ParseWalletRepo } from "./infrastructure/parse/repositories/WalletRepo.js";
import { ParseWalletTransactionRepo } from "./infrastructure/parse/repositories/WalletTransactionRepo.js";
import { ParseSlotMachineSpinRepo } from "./infrastructure/parse/repositories/SlotMachineSpinRepo.js";
import { ParsePatternRaceBetRepo } from "./infrastructure/parse/repositories/PatternRaceBetRepo.js";
import { JwtService } from "./infrastructure/crypto/jwtService.js";
import { LoginUseCase } from "./application/use-cases/Login.js";
import { RefreshTokenUseCase } from "./application/use-cases/RefreshToken.js";
import { LogoutUseCase } from "./application/use-cases/Logout.js";
import { GetCurrentUserUseCase } from "./application/use-cases/GetCurrentUser.js";
import { CreateUserUseCase } from "./application/use-cases/CreateUser.js";
import { ListUsersUseCase } from "./application/use-cases/ListUsers.js";
import { ListDealerCandidatesUseCase } from "./application/use-cases/ListDealerCandidates.js";
import { UpdateUserUseCase } from "./application/use-cases/UpdateUser.js";
import { SetUserActiveUseCase } from "./application/use-cases/SetUserActive.js";
import { DeleteUserUseCase } from "./application/use-cases/DeleteUser.js";
import { BulkCreatePlayersUseCase } from "./application/use-cases/BulkCreatePlayers.js";
import { ListPlayerDepartamentosUseCase } from "./application/use-cases/ListPlayerDepartamentos.js";
import { LookupMatriculaUseCase } from "./application/use-cases/LookupMatricula.js";
import { CreateCasinoUseCase } from "./application/use-cases/CreateCasino.js";
import { ListCasinosUseCase } from "./application/use-cases/ListCasinos.js";
import { UpdateCasinoUseCase } from "./application/use-cases/UpdateCasino.js";
import { SetCasinoActiveUseCase } from "./application/use-cases/SetCasinoActive.js";
import { DeleteCasinoUseCase } from "./application/use-cases/DeleteCasino.js";
import { ListCasinoPlayersUseCase } from "./application/use-cases/ListCasinoPlayers.js";
import { CreateMesaUseCase } from "./application/use-cases/CreateMesa.js";
import { ListMesasByCasinoUseCase } from "./application/use-cases/ListMesasByCasino.js";
import { UpdateMesaUseCase } from "./application/use-cases/UpdateMesa.js";
import { SetMesaActiveUseCase } from "./application/use-cases/SetMesaActive.js";
import { DeleteMesaUseCase } from "./application/use-cases/DeleteMesa.js";
import { ListMyMesasUseCase } from "./application/use-cases/ListMyMesas.js";
import { ListMyCasinosUseCase } from "./application/use-cases/ListMyCasinos.js";
import { ListMyCasinoMesasUseCase } from "./application/use-cases/ListMyCasinoMesas.js";
import { GetMyCasinoMesaLastSpinUseCase } from "./application/use-cases/GetMyCasinoMesaLastSpin.js";
import { UpdateMyAliasUseCase } from "./application/use-cases/UpdateMyAlias.js";
import { RecordRouletteSpinUseCase } from "./application/use-cases/RecordRouletteSpin.js";
import { GetLastRouletteSpinUseCase } from "./application/use-cases/GetLastRouletteSpin.js";
import { BulkCreditCasinoPlayersUseCase } from "./application/use-cases/BulkCreditCasinoPlayers.js";
import { CreditPlayerInCasinoUseCase } from "./application/use-cases/CreditPlayerInCasino.js";
import { DebitPlayerInCasinoUseCase } from "./application/use-cases/DebitPlayerInCasino.js";
import { ListCasinoEconomyWalletsUseCase } from "./application/use-cases/ListCasinoEconomyWallets.js";
import { ListPlayerCasinoTransactionsUseCase } from "./application/use-cases/ListPlayerCasinoTransactions.js";
import { ListMyCasinoPlayersUseCase } from "./application/use-cases/ListMyCasinoPlayers.js";
import { TransferBetweenPlayersUseCase } from "./application/use-cases/TransferBetweenPlayers.js";
import { PlaySlotMachineSpinUseCase } from "./application/use-cases/PlaySlotMachineSpin.js";
import { ListSlotMachineHistoryUseCase } from "./application/use-cases/ListSlotMachineHistory.js";
import { GetMyCasinoWalletUseCase } from "./application/use-cases/GetMyCasinoWallet.js";
import { GetCurrentPatternRaceUseCase } from "./application/use-cases/patternRace/GetCurrentPatternRace.js";
import { PlacePatternRaceBetUseCase } from "./application/use-cases/patternRace/PlacePatternRaceBet.js";
import { ListMyPatternRaceBetsUseCase } from "./application/use-cases/patternRace/ListMyPatternRaceBets.js";
import { SettlePatternRaceBetsUseCase } from "./application/use-cases/patternRace/SettlePatternRaceBets.js";
import { AuthController } from "./interfaces/http/controllers/AuthController.js";
import { UserController } from "./interfaces/http/controllers/UserController.js";
import { CasinoController } from "./interfaces/http/controllers/CasinoController.js";
import { MesaController } from "./interfaces/http/controllers/MesaController.js";
import { MeController } from "./interfaces/http/controllers/MeController.js";
import { RouletteSpinController } from "./interfaces/http/controllers/RouletteSpinController.js";
import { EconomyController } from "./interfaces/http/controllers/EconomyController.js";
import { SlotMachineController } from "./interfaces/http/controllers/SlotMachineController.js";
import { PatternRaceController } from "./interfaces/http/controllers/PatternRaceController.js";
import { carreraMeRoutes, carreraPublicRoutes } from "./interfaces/http/routes/carrera.routes.js";
import { bootstrapInitialMaster } from "./infrastructure/seed/bootstrap.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function parseDurationMs(spec: string, fallback: number): number {
  const m = /^(\d+)\s*([smhd])$/.exec(spec.trim());
  if (!m) return fallback;
  const n = Number(m[1]);
  switch (m[2]) {
    case "s":
      return n * 1000;
    case "m":
      return n * 60_000;
    case "h":
      return n * 3_600_000;
    case "d":
      return n * 86_400_000;
    default:
      return fallback;
  }
}

export async function createApp(env: Env): Promise<Express> {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  const parseServer = buildParseServer(env);
  await parseServer.start();
  app.use("/parse", parseServer.app);

  // Wire the domain/application/infrastructure graph.
  const parse = initParseClient(env);
  const userRepo = new ParseAppUserRepo(parse);
  const sessionRepo = new ParseAppSessionRepo(parse);
  const casinoRepo = new ParseCasinoRepo(parse);
  const mesaRepo = new ParseMesaRepo(parse);
  const spinRepo = new ParseRouletteSpinRepo(parse);
  const walletRepo = new ParseWalletRepo(parse);
  const walletTxRepo = new ParseWalletTransactionRepo(parse);
  const slotSpinRepo = new ParseSlotMachineSpinRepo(parse);
  const patternRaceBetRepo = new ParsePatternRaceBetRepo(parse);
  const jwt = new JwtService({
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshTtl: env.JWT_REFRESH_TTL,
  });
  const refreshTtlMs = parseDurationMs(env.JWT_REFRESH_TTL, SEVEN_DAYS_MS);

  const login = new LoginUseCase(userRepo, sessionRepo, jwt, refreshTtlMs);
  const refresh = new RefreshTokenUseCase(userRepo, sessionRepo, jwt, refreshTtlMs);
  const logout = new LogoutUseCase(sessionRepo);
  const getMe = new GetCurrentUserUseCase(userRepo);
  const createUser = new CreateUserUseCase(userRepo);
  const listUsers = new ListUsersUseCase(userRepo);
  const listDealerCandidates = new ListDealerCandidatesUseCase(userRepo);
  const updateUser = new UpdateUserUseCase(userRepo);
  const setUserActive = new SetUserActiveUseCase(userRepo, sessionRepo);
  const deleteUser = new DeleteUserUseCase(userRepo, sessionRepo);
  const bulkCreatePlayers = new BulkCreatePlayersUseCase(createUser);
  const listPlayerDepartamentos = new ListPlayerDepartamentosUseCase(userRepo);
  const lookupMatricula = new LookupMatriculaUseCase(userRepo);
  const createCasino = new CreateCasinoUseCase(casinoRepo);
  const listCasinos = new ListCasinosUseCase(casinoRepo);
  const updateCasino = new UpdateCasinoUseCase(casinoRepo, userRepo);
  const setCasinoActive = new SetCasinoActiveUseCase(casinoRepo);
  const deleteCasino = new DeleteCasinoUseCase(casinoRepo);
  const listCasinoPlayers = new ListCasinoPlayersUseCase(casinoRepo, userRepo);
  const createMesa = new CreateMesaUseCase(mesaRepo, casinoRepo);
  const listMesas = new ListMesasByCasinoUseCase(mesaRepo);
  const updateMesa = new UpdateMesaUseCase(mesaRepo, userRepo, casinoRepo);
  const setMesaActive = new SetMesaActiveUseCase(mesaRepo);
  const deleteMesa = new DeleteMesaUseCase(mesaRepo);
  const listMyMesas = new ListMyMesasUseCase(mesaRepo, casinoRepo);
  const listMyCasinos = new ListMyCasinosUseCase(casinoRepo, userRepo);
  const listMyCasinoMesas = new ListMyCasinoMesasUseCase(
    mesaRepo,
    casinoRepo,
    userRepo,
  );
  const getMyCasinoMesaLastSpin = new GetMyCasinoMesaLastSpinUseCase(
    spinRepo,
    mesaRepo,
    casinoRepo,
    userRepo,
  );
  const updateMyAlias = new UpdateMyAliasUseCase(userRepo);
  const recordSpin = new RecordRouletteSpinUseCase(spinRepo, mesaRepo);
  const getLastSpin = new GetLastRouletteSpinUseCase(spinRepo, mesaRepo);
  const bulkCreditCasinoPlayers = new BulkCreditCasinoPlayersUseCase(
    casinoRepo,
    walletRepo,
    walletTxRepo,
    listCasinoPlayers,
  );
  const creditPlayerInCasino = new CreditPlayerInCasinoUseCase(
    casinoRepo,
    userRepo,
    walletRepo,
    walletTxRepo,
  );
  const debitPlayerInCasino = new DebitPlayerInCasinoUseCase(
    casinoRepo,
    userRepo,
    walletRepo,
    walletTxRepo,
  );
  const listMyCasinoPlayers = new ListMyCasinoPlayersUseCase(
    casinoRepo,
    userRepo,
    listCasinoPlayers,
  );
  const transferBetweenPlayers = new TransferBetweenPlayersUseCase(
    casinoRepo,
    userRepo,
    walletRepo,
    walletTxRepo,
  );
  const listCasinoEconomyWallets = new ListCasinoEconomyWalletsUseCase(
    casinoRepo,
    walletRepo,
    listCasinoPlayers,
  );
  const listPlayerCasinoTransactions = new ListPlayerCasinoTransactionsUseCase(
    casinoRepo,
    userRepo,
    walletTxRepo,
  );
  const playSlotMachineSpin = new PlaySlotMachineSpinUseCase(
    casinoRepo,
    userRepo,
    walletRepo,
    walletTxRepo,
    slotSpinRepo,
  );
  const listSlotMachineHistory = new ListSlotMachineHistoryUseCase(
    casinoRepo,
    slotSpinRepo,
  );
  const getMyCasinoWallet = new GetMyCasinoWalletUseCase(casinoRepo, walletRepo);
  const settlePatternRaceBets = new SettlePatternRaceBetsUseCase(
    walletRepo,
    walletTxRepo,
    patternRaceBetRepo,
  );
  const getCurrentPatternRace = new GetCurrentPatternRaceUseCase(
    casinoRepo,
    settlePatternRaceBets,
  );
  const placePatternRaceBet = new PlacePatternRaceBetUseCase(
    casinoRepo,
    userRepo,
    walletRepo,
    walletTxRepo,
    patternRaceBetRepo,
  );
  const listMyPatternRaceBets = new ListMyPatternRaceBetsUseCase(
    casinoRepo,
    patternRaceBetRepo,
    settlePatternRaceBets,
  );

  const authController = new AuthController(login, refresh, logout, getMe, lookupMatricula);
  const userController = new UserController(
    createUser,
    listUsers,
    updateUser,
    setUserActive,
    deleteUser,
    bulkCreatePlayers,
    listPlayerDepartamentos,
    listDealerCandidates,
  );
  const casinoController = new CasinoController(
    createCasino,
    listCasinos,
    updateCasino,
    setCasinoActive,
    deleteCasino,
    listCasinoPlayers,
    casinoRepo,
  );
  const mesaController = new MesaController(
    createMesa,
    listMesas,
    updateMesa,
    setMesaActive,
    deleteMesa,
  );
  const meController = new MeController(
    listMyMesas,
    listMyCasinos,
    listMyCasinoMesas,
    listMyCasinoPlayers,
    getMyCasinoMesaLastSpin,
    updateMyAlias,
    transferBetweenPlayers,
  );
  const spinController = new RouletteSpinController(recordSpin, getLastSpin);
  const economyController = new EconomyController(
    bulkCreditCasinoPlayers,
    creditPlayerInCasino,
    debitPlayerInCasino,
    listCasinoEconomyWallets,
    listPlayerCasinoTransactions,
  );
  const slotMachineController = new SlotMachineController(
    playSlotMachineSpin,
    listSlotMachineHistory,
    getMyCasinoWallet,
  );
  const patternRaceController = new PatternRaceController(
    getCurrentPatternRace,
    placePatternRaceBet,
    listMyPatternRaceBets,
  );

  const requireAuthMw = requireAuth(jwt);
  const requireMasterMw = requireRole("master");

  app.use("/api/v1", apiRoutes(env.APP_NAME));
  app.use("/api/v1/auth", authRoutes(authController, requireAuthMw));
  app.use("/api/v1/users", userRoutes(userController, requireAuthMw, requireMasterMw));
  app.use("/api/v1/casinos", casinoRoutes(casinoController, requireAuthMw, requireMasterMw));
  app.use(
    "/api/v1/casinos/:casinoId/mesas",
    mesaRoutes(mesaController, requireAuthMw, requireMasterMw),
  );
  app.use("/api/v1/me", meRoutes(meController, requireAuthMw));
  app.use(
    "/api/v1/mesas/:mesaId/spins",
    rouletteSpinRoutes(spinController, requireAuthMw),
  );
  // Montado bajo /me/ (no bajo /casinos/) para escapar del middleware
  // requireMaster que gatea todo el router de casinos. El propio middleware
  // requireCasinoEconomyAccess decide master-or-dealer-of-casino.
  app.use(
    "/api/v1/me/casinos/:casinoId/economy",
    economyRoutes(
      economyController,
      requireAuthMw,
      requireCasinoEconomyAccess(mesaRepo),
    ),
  );
  // Montado bajo /me/ en vez de /casinos/ para escapar del middleware
  // requireMaster que aplica a todo el router de casinos — la tragamonedas
  // es un flujo de jugador y no debe pasar por ese gating.
  app.use(
    "/api/v1/me/casinos/:casinoId/slots",
    slotsRoutes(slotMachineController, requireAuthMw),
  );
  // Carrera de Patrones. El endpoint /current es PÚBLICO (sin auth) a
  // propósito: cualquier pantalla puede proyectar la carrera tecleando la
  // URL con el casinoId. Las apuestas sí requieren auth de jugador.
  app.use(
    "/api/v1/public/casinos/:casinoId/carrera",
    carreraPublicRoutes(patternRaceController),
  );
  app.use(
    "/api/v1/me/casinos/:casinoId/carrera",
    carreraMeRoutes(patternRaceController, requireAuthMw),
  );

  // Unified deployment: serve the built SPA from the same origin as the API.
  // Static assets get direct hits; every other GET falls back to index.html so
  // React Router (BrowserRouter) can handle the client-side route.
  if (env.SERVE_FRONTEND) {
    const moduleDir = dirname(fileURLToPath(import.meta.url));
    const frontendDist = resolvePath(moduleDir, "../../frontend/dist");
    if (!existsSync(joinPath(frontendDist, "index.html"))) {
      console.warn(
        `[static] SERVE_FRONTEND is on but frontend build is missing at ${frontendDist}. ` +
          `Run \`yarn build\` (or \`yarn prod\`) before starting.`,
      );
    } else {
      console.log(`[static] Serving SPA from ${frontendDist}`);
      app.use(express.static(frontendDist, { index: false }));
      app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        if (req.path.startsWith("/api/") || req.path.startsWith("/parse")) {
          return next();
        }
        res.sendFile(joinPath(frontendDist, "index.html"));
      });
    }
  }

  app.use(errorHandler);

  // Expose the user repo so the server can seed after `listen()` (Parse SDK talks
  // over HTTP to our own Parse Server, so the server must be listening first).
  (app as Express & { __userRepo?: ParseAppUserRepo }).__userRepo = userRepo;

  return app;
}

export async function seedInitialData(app: Express): Promise<void> {
  const repo = (app as Express & { __userRepo?: ParseAppUserRepo }).__userRepo;
  if (!repo) throw new Error("userRepo not attached to app");
  await bootstrapInitialMaster(repo);
}
