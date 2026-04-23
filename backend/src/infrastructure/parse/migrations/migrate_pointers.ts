import type Parse from "parse/node";
import { loadEnv } from "../../../config/env.js";
import { initParseClient } from "../parseClient.js";

/**
 * One-off migration: backfills Parse pointer columns from the legacy string
 * FK columns so existing rows survive the string→pointer refactor.
 *
 * What it does:
 *   AppSession: if `user` (pointer to AppUser) is missing and `userId` (string) is
 *               present, set the pointer from that id.
 *   Mesa:       if `casino` (pointer to Casino) is missing and `casinoId` (string)
 *               is present, set the pointer from that id.
 *
 * What it does NOT do:
 *   - Delete the legacy string columns. The project owner confirmed they'll
 *     remove those from the Parse dashboard manually after the migration.
 *   - Touch rows that already have the pointer populated (idempotent).
 *   - Populate the new Mesa.tallador field — that has no legacy source.
 *
 * Requires the Parse Server to be running (the Node SDK talks HTTP to it).
 * Run with:
 *   yarn --cwd backend migrate:pointers
 */

type Counter = {
  scanned: number;
  migrated: number;
  alreadyOk: number;
  skippedMissingLegacy: number;
};

function newCounter(): Counter {
  return { scanned: 0, migrated: 0, alreadyOk: 0, skippedMissingLegacy: 0 };
}

function summarize(label: string, c: Counter): void {
  console.log(
    `[migrate] ${label}: scanned=${c.scanned} migrated=${c.migrated} alreadyOk=${c.alreadyOk} skipped(no legacy id)=${c.skippedMissingLegacy}`,
  );
}

async function migrateAppSessions(parse: typeof Parse): Promise<Counter> {
  const c = newCounter();
  const Obj = parse.Object.extend("AppUser");
  const Query = parse.Query;
  const SessionClass = parse.Object.extend("AppSession");
  const all = await new Query(SessionClass)
    .limit(10_000)
    .find({ useMasterKey: true });

  for (const row of all) {
    c.scanned += 1;
    const existingPointer = row.get("user") as Parse.Object | undefined;
    if (existingPointer?.id) {
      c.alreadyOk += 1;
      continue;
    }
    const legacyUserId = row.get("userId");
    if (typeof legacyUserId !== "string" || legacyUserId.length === 0) {
      c.skippedMissingLegacy += 1;
      console.warn(
        `[migrate] AppSession ${row.id} has neither user pointer nor userId — skipping.`,
      );
      continue;
    }
    row.set("user", Obj.createWithoutData(legacyUserId));
    await row.save(null, { useMasterKey: true });
    c.migrated += 1;
  }
  return c;
}

async function migrateMesas(parse: typeof Parse): Promise<Counter> {
  const c = newCounter();
  const CasinoCls = parse.Object.extend("Casino");
  const Query = parse.Query;
  const MesaClass = parse.Object.extend("Mesa");
  const all = await new Query(MesaClass)
    .limit(10_000)
    .find({ useMasterKey: true });

  for (const row of all) {
    c.scanned += 1;
    const existingPointer = row.get("casino") as Parse.Object | undefined;
    if (existingPointer?.id) {
      c.alreadyOk += 1;
      continue;
    }
    const legacyCasinoId = row.get("casinoId");
    if (typeof legacyCasinoId !== "string" || legacyCasinoId.length === 0) {
      c.skippedMissingLegacy += 1;
      console.warn(
        `[migrate] Mesa ${row.id} has neither casino pointer nor casinoId — skipping.`,
      );
      continue;
    }
    row.set("casino", CasinoCls.createWithoutData(legacyCasinoId));
    await row.save(null, { useMasterKey: true });
    c.migrated += 1;
  }
  return c;
}

async function main(): Promise<void> {
  const env = loadEnv();
  console.log(`[migrate] target Parse server: ${env.PARSE_SERVER_URL}`);
  const parse = initParseClient(env);

  console.log("[migrate] AppSession.userId → AppSession.user …");
  const sessions = await migrateAppSessions(parse);
  summarize("AppSession", sessions);

  console.log("[migrate] Mesa.casinoId → Mesa.casino …");
  const mesas = await migrateMesas(parse);
  summarize("Mesa", mesas);

  console.log("[migrate] done. Remaining step: remove the legacy string columns manually from the Parse dashboard.");
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
