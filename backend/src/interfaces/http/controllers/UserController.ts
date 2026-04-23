import type { Request, Response, NextFunction } from "express";
import type { CreateUserUseCase } from "../../../application/use-cases/CreateUser.js";
import type { ListUsersUseCase } from "../../../application/use-cases/ListUsers.js";
import type { UpdateUserUseCase } from "../../../application/use-cases/UpdateUser.js";
import type { SetUserActiveUseCase } from "../../../application/use-cases/SetUserActive.js";
import type { DeleteUserUseCase } from "../../../application/use-cases/DeleteUser.js";
import type {
  BulkCreatePlayersUseCase,
  BulkPlayerRow,
} from "../../../application/use-cases/BulkCreatePlayers.js";
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
    private readonly bulkCreatePlayers: BulkCreatePlayersUseCase,
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
      const { matricula, password, fullName, departamento } = req.body ?? {};
      if (typeof matricula !== "string") {
        res.status(400).json({ status: "error", message: "matricula required" });
        return;
      }
      const isStaff = role === "master" || role === "dealer";
      if (isStaff && typeof password !== "string") {
        res.status(400).json({ status: "error", message: "password required for staff" });
        return;
      }
      const user = await this.createUser.execute({
        matricula,
        password: typeof password === "string" ? password : undefined,
        role,
        fullName: typeof fullName === "string" && fullName.trim() ? fullName.trim() : null,
        departamento:
          typeof departamento === "string" && departamento.trim()
            ? departamento.trim()
            : null,
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
      const { fullName, password, departamento } = req.body ?? {};
      const user = await this.updateUser.execute({
        userId,
        fullName:
          typeof fullName === "string" ? fullName : fullName === null ? null : undefined,
        departamento:
          typeof departamento === "string"
            ? departamento
            : departamento === null
              ? null
              : undefined,
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

  /**
   * POST /users/players/bulk — CSV import endpoint. Players collection only:
   * staff accounts must be created one-by-one because they need a password.
   * Body: { players: [{matricula, fullName?, departamento?}, ...] }.
   * Each row is attempted independently; failures don't stop the batch.
   */
  bulkImportPlayers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = resolveRole(req);
      if (role !== "player") {
        res
          .status(400)
          .json({ status: "error", message: "Bulk import is only available for players" });
        return;
      }
      const body = req.body ?? {};
      const players = body.players;
      if (!Array.isArray(players)) {
        res
          .status(400)
          .json({ status: "error", message: "Body must include a 'players' array" });
        return;
      }
      if (players.length === 0) {
        res.status(400).json({ status: "error", message: "No players to import" });
        return;
      }
      if (players.length > 500) {
        res
          .status(400)
          .json({ status: "error", message: "Batch too large (max 500 rows)" });
        return;
      }
      const rows: BulkPlayerRow[] = players.map((p: unknown) => {
        const row = (p ?? {}) as Record<string, unknown>;
        return {
          matricula: typeof row.matricula === "string" ? row.matricula : "",
          fullName: typeof row.fullName === "string" ? row.fullName : null,
          departamento:
            typeof row.departamento === "string" ? row.departamento : null,
        };
      });
      const output = await this.bulkCreatePlayers.execute(rows);
      res.status(200).json(output);
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
