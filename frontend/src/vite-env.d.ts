/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE?: string;
  readonly VITE_PORT?: string;
  readonly VITE_PARSE_APP_ID: string;
  readonly VITE_PARSE_CLIENT_KEY: string;
  readonly VITE_PARSE_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
