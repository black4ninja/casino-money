import type { Request, Response, NextFunction } from "express";
import type { LoginUseCase } from "../../../application/use-cases/Login.js";
import type { RefreshTokenUseCase } from "../../../application/use-cases/RefreshToken.js";
import type { LogoutUseCase } from "../../../application/use-cases/Logout.js";
import type { GetCurrentUserUseCase } from "../../../application/use-cases/GetCurrentUser.js";

export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshTokenUseCase,
    private readonly logout: LogoutUseCase,
    private readonly me: GetCurrentUserUseCase,
  ) {}

  handleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { matricula, password } = req.body ?? {};
      if (typeof matricula !== "string" || typeof password !== "string") {
        res.status(400).json({ status: "error", message: "matricula + password required" });
        return;
      }
      const result = await this.login.execute({
        matricula,
        password,
        userAgent: req.headers["user-agent"] ?? null,
      });
      res.json({
        user: result.user.toPublic(),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err) {
      next(err);
    }
  };

  handleRefresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body ?? {};
      if (typeof refreshToken !== "string") {
        res.status(400).json({ status: "error", message: "refreshToken required" });
        return;
      }
      const result = await this.refresh.execute({
        refreshToken,
        userAgent: req.headers["user-agent"] ?? null,
      });
      res.json({
        user: result.user.toPublic(),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err) {
      next(err);
    }
  };

  handleLogout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken, allDevices } = req.body ?? {};
      await this.logout.execute({
        refreshToken: typeof refreshToken === "string" ? refreshToken : undefined,
        userId: req.user?.sub,
        allDevices: Boolean(allDevices),
      });
      res.json({ status: "ok" });
    } catch (err) {
      next(err);
    }
  };

  handleMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.me.execute(req.user!.sub);
      res.json({ user: user.toPublic() });
    } catch (err) {
      next(err);
    }
  };
}
