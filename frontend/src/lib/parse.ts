import Parse from "parse";

Parse.initialize(
  import.meta.env.VITE_PARSE_APP_ID,
  import.meta.env.VITE_PARSE_CLIENT_KEY,
);
Parse.serverURL =
  import.meta.env.VITE_PARSE_SERVER_URL ?? "http://localhost:1448/parse";

export { Parse };

/** Base URL of the backend (derives it from the Parse server URL by stripping "/parse"). */
export function getBackendBaseURL(): string {
  const url = import.meta.env.VITE_PARSE_SERVER_URL ?? "http://localhost:1448/parse";
  return url.replace(/\/parse\/?$/, "");
}
