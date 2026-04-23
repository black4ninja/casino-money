import Parse from "parse";

/**
 * Resolve the Parse Server URL. Resolution order:
 *   1. VITE_PARSE_SERVER_URL — explicit override (dev, staging, split-origin prod).
 *   2. Same-origin `/parse` — used when the backend serves the SPA itself
 *      (unified `yarn prod` deployment). No env var needed at build time.
 *   3. Hardcoded localhost fallback — last resort for non-browser contexts.
 */
function resolveParseServerURL(): string {
  const explicit = import.meta.env.VITE_PARSE_SERVER_URL;
  if (explicit && explicit.length > 0) return explicit;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/parse`;
  }
  return "http://localhost:1448/parse";
}

const PARSE_SERVER_URL = resolveParseServerURL();

Parse.initialize(
  import.meta.env.VITE_PARSE_APP_ID,
  import.meta.env.VITE_PARSE_CLIENT_KEY,
);
Parse.serverURL = PARSE_SERVER_URL;

export { Parse };

/** Base URL of the backend (derives it from the Parse server URL by stripping "/parse"). */
export function getBackendBaseURL(): string {
  return PARSE_SERVER_URL.replace(/\/parse\/?$/, "");
}
