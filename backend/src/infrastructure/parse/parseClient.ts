import Parse from "parse/node";
import type { Env } from "../../config/env.js";

let initialized = false;

// Parse/node augments the default export at runtime with `initialize(appId, jsKey, masterKey)`,
// but the TS typings don't always propagate that method. Cast narrowly.
type ParseWithInit = typeof Parse & {
  initialize: (appId: string, jsKey?: string, masterKey?: string) => void;
  serverURL: string;
};

/**
 * Initializes the Parse Node SDK pointing at our OWN Parse Server.
 * All repositories use `useMasterKey: true` because they serve authenticated
 * API requests on the server side, never the public client.
 */
export function initParseClient(env: Env): typeof Parse {
  const P = Parse as unknown as ParseWithInit;
  if (!initialized) {
    P.initialize(env.PARSE_APP_ID, undefined, env.PARSE_MASTER_KEY);
    P.serverURL = env.PARSE_SERVER_URL;
    initialized = true;
  }
  return Parse;
}

export { Parse };
