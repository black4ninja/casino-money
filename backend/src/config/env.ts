import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
loadDotenv({ path: resolve(repoRoot, ".env") });

export type Env = {
  PARSE_SERVER_PORT: number;
  PARSE_SERVER_URL: string;
  MONGODB_URI: string;
  PARSE_APP_ID: string;
  PARSE_MASTER_KEY: string;
  PARSE_CLIENT_KEY: string;
  APP_NAME: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_TTL: string;
  JWT_REFRESH_TTL: string;
  /**
   * When true, the backend serves the built SPA (frontend/dist) and handles
   * the client-side router fallback. Auto-enabled in production; can be
   * forced in dev with SERVE_FRONTEND=1.
   */
  SERVE_FRONTEND: boolean;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[config] Missing required env var: ${name}`);
  }
  return value;
}

function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function loadEnv(): Env {
  const serveFrontend =
    parseBool(process.env.SERVE_FRONTEND) ||
    process.env.NODE_ENV === "production";
  return {
    PARSE_SERVER_PORT: Number(process.env.PARSE_SERVER_PORT ?? 1448),
    PARSE_SERVER_URL: required("PARSE_SERVER_URL"),
    MONGODB_URI: required("MONGODB_URI"),
    PARSE_APP_ID: required("PARSE_APP_ID"),
    PARSE_MASTER_KEY: required("PARSE_MASTER_KEY"),
    PARSE_CLIENT_KEY: required("PARSE_CLIENT_KEY"),
    APP_NAME: process.env.APP_NAME ?? "CasinoGame",
    JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET"),
    JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
    JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL ?? "15m",
    JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL ?? "7d",
    SERVE_FRONTEND: serveFrontend,
  };
}
