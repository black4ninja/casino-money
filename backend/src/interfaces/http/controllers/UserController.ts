import type { Request, Response, NextFunction } from "express";
import type { CreateUserUseCase } from "../../../application/use-cases/CreateUser.js";
import type { ListUsersUseCase } from "../../../application/use-cases/ListUsers.js";
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

export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
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
}
