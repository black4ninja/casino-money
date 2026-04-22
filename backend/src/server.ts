import { loadEnv } from "./config/env.js";
import { createApp, seedInitialData } from "./app.js";

async function main() {
  const env = loadEnv();
  const app = await createApp(env);
  app.listen(env.PARSE_SERVER_PORT, async () => {
    console.log(
      `[backend] ${env.APP_NAME} listening on http://localhost:${env.PARSE_SERVER_PORT}`,
    );
    console.log(`[backend] Parse Server mounted at /parse`);
    console.log(`[backend] REST API mounted at /api/v1`);
    try {
      await seedInitialData(app);
    } catch (err) {
      console.error("[seed] failed:", err);
    }
  });
}

main().catch((err) => {
  console.error("[backend] fatal error during startup:", err);
  process.exit(1);
});
