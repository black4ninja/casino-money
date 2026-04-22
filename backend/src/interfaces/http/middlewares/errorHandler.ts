import type { ErrorRequestHandler } from "express";
import { AuthError } from "../../../domain/errors/AuthError.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AuthError) {
    res.status(err.status).json({
      status: "error",
      code: err.code,
      message: err.message,
    });
    return;
  }
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = err?.message ?? "Internal server error";
  console.error("[error]", err);
  res.status(status).json({ status: "error", message });
};
