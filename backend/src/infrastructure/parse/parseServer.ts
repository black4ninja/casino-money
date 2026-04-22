import { ParseServer } from "parse-server";
import type { Env } from "../../config/env.js";

export function buildParseServer(env: Env): ParseServer {
  return new ParseServer({
    databaseURI: env.MONGODB_URI,
    appId: env.PARSE_APP_ID,
    masterKey: env.PARSE_MASTER_KEY,
    clientKey: env.PARSE_CLIENT_KEY,
    serverURL: env.PARSE_SERVER_URL,
    allowClientClassCreation: true,
  });
}
