import type { Request, Response, NextFunction } from "express";
import type { CreateUserUseCase } from "../../../application/use-cases/CreateUser.js";
import type { ListUsersUseCase } from "../../../application/use-cases/ListUsers.js";
import type { UpdateUserUseCase } from "../../../application/use-cases/UpdateUser.js";
import type { SetUserActiveUseCase } from "../../../application/use-cases/SetUserActive.js";
import type { DeleteUserUseCase } from "../../../application/use-cases/DeleteUser.js";
import type { Role } from "../../../domain/entities/Role.js";

const COLLECTION_TO_ROLE: Record<string, Role> = {
  masters: "master",
  dealers: "dealer",
  players: "player",
};

function resolveRole(req: Request): Role | null {
  const collection = req.params.collection;
  if (!collection) return null;
  return COLLECTION_TO_ROLE[collection] ?? null;
}

function resolveUserId(req: Request): string | null {
  const id = req.params.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly setUserActive: SetUserActiveUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  listByCollection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = resolveRole(req);
      if (!role) {
        res.status(404).json({ status: "error", message: "Unknown user collection" });
        return;
      }
      const users = await this.listUsers.execute(role);
      res.json({ users: users.map((u) => u.toPublic()) });
    } catch (err) {
      next(err);
    }
  };

  createInCollection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = resolveRole(req);
      if (!role) {
        res.status(404).json({ status: "error", message: "Unknown user collection" });
        return;
      }
      const { matricula, password, fullName } = req.body ?? {};
      if (typeof matricula !== "string" || typeof password !== "string") {
        res.status(400).json({ status: "error", message: "matricula + password required" });
        return;
      }
      const user = await this.createUser.execute({
        matricula,
        password,
        role,
        fullName: typeof fullName === "string" && fullName.trim() ? fullName.trim() : null,
      });
      res.status(201).json({ user: user.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  updateInCollection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = resolveUserId(req);
      if (!userId) {
        res.status(400).json({ status: "error", message: "user id required" });
        return;
      }
      const { fullName, password } = req.body ?? {};
      const user = await this.updateUser.execute({
        userId,
        fullName:
          typeof fullName === "string" ? fullName : fullName === null ? null : undefined,
        password: typeof password === "string" && password.length > 0 ? password : undefined,
      });
      res.json({ user: user.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  archiveInCollection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = resolveUserId(req);
      if (!userId) {
        res.status(400).json({ status: "error", message: "user id required" });
        return;
      }
      const user = await this.setUserActive.execute({
        actorId: req.user!.sub,
        userId,
        active: false,
      });
      res.json({ user: user.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  unarchiveInCollection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = resolveUserId(req);
      if (!userId) {
        res.status(400).json({ status: "error", message: "user id required" });
        return;
      }
      const user = await this.setUserActive.execute({
        actorId: req.user!.sub,
        userId,
        active: true,
      });
      res.json({ user: user.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  deleteInCollection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = resolveUserId(req);
      if (!userId) {
        res.status(400).json({ status: "error", message: "user id required" });
        return;
      }
      await this.deleteUser.execute({ actorId: req.user!.sub, userId });
      res.json({ status: "ok" });
    } catch (err) {
      next(err);
    }
  };
}
