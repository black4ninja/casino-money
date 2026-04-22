declare module "parse-server" {
  import type { RequestHandler } from "express";

  export interface ParseServerOptions {
    databaseURI: string;
    appId: string;
    masterKey: string;
    clientKey?: string;
    serverURL: string;
    allowClientClassCreation?: boolean;
    cloud?: string;
    [key: string]: unknown;
  }

  export class ParseServer {
    constructor(options: ParseServerOptions);
    start(): Promise<void>;
    readonly app: RequestHandler;
  }
}
