import express, { type Express } from "express";
import cors from "cors";
import type { Env } from "./config/env.js";
import { buildParseServer } from "./infrastructure/parse/parseServer.js";
import { initParseClient } from "./infrastructure/parse/parseClient.js";
import { apiRoutes } from "./interfaces/http/routes/index.js";
import { authRoutes } from "./interfaces/http/routes/auth.routes.js";
import { userRoutes } from "./interfaces/http/routes/users.routes.js";
import { errorHandler } from "./interfaces/http/middlewares/errorHandler.js";
import { requireAuth } from "./interfaces/http/middlewares/requireAuth.js";
import { requireRole } from "./interfaces/http/middlewares/requireRole.js";
import { ParseAppUserRepo } from "./infrastructure/parse/repositories/AppUserRepo.js";
import { ParseAppSessionRepo } from "./infrastructure/parse/repositories/AppSessionRepo.js";
import { JwtService } from "./infrastructure/crypto/jwtService.js";
import { LoginUseCase } from "./application/use-cases/Login.js";
import { RefreshTokenUseCase } from "./application/use-cases/RefreshToken.js";
import { LogoutUseCase } from "./application/use-cases/Logout.js";
import { GetCurrentUserUseCase } from "./application/use-cases/GetCurrentUser.js";
import { CreateUserUseCase } from "./application/use-cases/CreateUser.js";
import { ListUsersUseCase } from "./application/use-cases/ListUsers.js";
import { AuthController } from "./interfaces/http/controllers/AuthController.js";
import { UserController } from "./interfaces/http/controllers/UserController.js";
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

  const authController = new AuthController(login, refresh, logout, getMe);
  const userController = new UserController(createUser, listUsers);

  const requireAuthMw = requireAuth(jwt);
  const requireMasterMw = requireRole("master");

  app.use("/api/v1", apiRoutes(env.APP_NAME));
  app.use("/api/v1/auth", authRoutes(authController, requireAuthMw));
  app.use("/api/v1/users", userRoutes(userController, requireAuthMw, requireMasterMw));

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
