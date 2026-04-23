import express, { type Express } from "express";
import cors from "cors";
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
import { errorHandler } from "./interfaces/http/middlewares/errorHandler.js";
import { requireAuth } from "./interfaces/http/middlewares/requireAuth.js";
import { requireRole } from "./interfaces/http/middlewares/requireRole.js";
import { ParseAppUserRepo } from "./infrastructure/parse/repositories/AppUserRepo.js";
import { ParseAppSessionRepo } from "./infrastructure/parse/repositories/AppSessionRepo.js";
import { ParseCasinoRepo } from "./infrastructure/parse/repositories/CasinoRepo.js";
import { ParseMesaRepo } from "./infrastructure/parse/repositories/MesaRepo.js";
import { ParseRouletteSpinRepo } from "./infrastructure/parse/repositories/RouletteSpinRepo.js";
import { JwtService } from "./infrastructure/crypto/jwtService.js";
import { LoginUseCase } from "./application/use-cases/Login.js";
import { RefreshTokenUseCase } from "./application/use-cases/RefreshToken.js";
import { LogoutUseCase } from "./application/use-cases/Logout.js";
import { GetCurrentUserUseCase } from "./application/use-cases/GetCurrentUser.js";
import { CreateUserUseCase } from "./application/use-cases/CreateUser.js";
import { ListUsersUseCase } from "./application/use-cases/ListUsers.js";
import { UpdateUserUseCase } from "./application/use-cases/UpdateUser.js";
import { SetUserActiveUseCase } from "./application/use-cases/SetUserActive.js";
import { DeleteUserUseCase } from "./application/use-cases/DeleteUser.js";
import { LookupMatriculaUseCase } from "./application/use-cases/LookupMatricula.js";
import { CreateCasinoUseCase } from "./application/use-cases/CreateCasino.js";
import { ListCasinosUseCase } from "./application/use-cases/ListCasinos.js";
import { UpdateCasinoUseCase } from "./application/use-cases/UpdateCasino.js";
import { SetCasinoActiveUseCase } from "./application/use-cases/SetCasinoActive.js";
import { DeleteCasinoUseCase } from "./application/use-cases/DeleteCasino.js";
import { CreateMesaUseCase } from "./application/use-cases/CreateMesa.js";
import { ListMesasByCasinoUseCase } from "./application/use-cases/ListMesasByCasino.js";
import { UpdateMesaUseCase } from "./application/use-cases/UpdateMesa.js";
import { SetMesaActiveUseCase } from "./application/use-cases/SetMesaActive.js";
import { DeleteMesaUseCase } from "./application/use-cases/DeleteMesa.js";
import { ListMyMesasUseCase } from "./application/use-cases/ListMyMesas.js";
import { RecordRouletteSpinUseCase } from "./application/use-cases/RecordRouletteSpin.js";
import { GetLastRouletteSpinUseCase } from "./application/use-cases/GetLastRouletteSpin.js";
import { AuthController } from "./interfaces/http/controllers/AuthController.js";
import { UserController } from "./interfaces/http/controllers/UserController.js";
import { CasinoController } from "./interfaces/http/controllers/CasinoController.js";
import { MesaController } from "./interfaces/http/controllers/MesaController.js";
import { MeController } from "./interfaces/http/controllers/MeController.js";
import { RouletteSpinController } from "./interfaces/http/controllers/RouletteSpinController.js";
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
  const updateUser = new UpdateUserUseCase(userRepo);
  const setUserActive = new SetUserActiveUseCase(userRepo, sessionRepo);
  const deleteUser = new DeleteUserUseCase(userRepo, sessionRepo);
  const lookupMatricula = new LookupMatriculaUseCase(userRepo);
  const createCasino = new CreateCasinoUseCase(casinoRepo);
  const listCasinos = new ListCasinosUseCase(casinoRepo);
  const updateCasino = new UpdateCasinoUseCase(casinoRepo);
  const setCasinoActive = new SetCasinoActiveUseCase(casinoRepo);
  const deleteCasino = new DeleteCasinoUseCase(casinoRepo);
  const createMesa = new CreateMesaUseCase(mesaRepo, casinoRepo);
  const listMesas = new ListMesasByCasinoUseCase(mesaRepo);
  const updateMesa = new UpdateMesaUseCase(mesaRepo, userRepo);
  const setMesaActive = new SetMesaActiveUseCase(mesaRepo);
  const deleteMesa = new DeleteMesaUseCase(mesaRepo);
  const listMyMesas = new ListMyMesasUseCase(mesaRepo, casinoRepo);
  const recordSpin = new RecordRouletteSpinUseCase(spinRepo, mesaRepo);
  const getLastSpin = new GetLastRouletteSpinUseCase(spinRepo, mesaRepo);

  const authController = new AuthController(login, refresh, logout, getMe, lookupMatricula);
  const userController = new UserController(
    createUser,
    listUsers,
    updateUser,
    setUserActive,
    deleteUser,
  );
  const casinoController = new CasinoController(
    createCasino,
    listCasinos,
    updateCasino,
    setCasinoActive,
    deleteCasino,
    casinoRepo,
  );
  const mesaController = new MesaController(
    createMesa,
    listMesas,
    updateMesa,
    setMesaActive,
    deleteMesa,
  );
  const meController = new MeController(listMyMesas);
  const spinController = new RouletteSpinController(recordSpin, getLastSpin);

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
