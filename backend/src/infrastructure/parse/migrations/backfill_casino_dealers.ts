import type Parse from "parse/node";
import { loadEnv } from "../../../config/env.js";
import { initParseClient } from "../parseClient.js";

/**
 * Idempotent migration: populates Casino.dealers from the dealers currently
 * assigned to the casino's mesas. Before this change Mesas could reference
 * any dealer in the catalog — now each casino owns a dealer pool and Mesa
 * assignments must live inside that pool. Without this backfill every
 * pre-existing assignment would suddenly become "out of pool" the moment an
 * admin adds a first dealer to casino.dealers.
 *
 * For every Casino we:
 *   1. Read the dealer pointers currently on its mesas (non-deleted).
 *   2. Union them with whatever is already in casino.dealers.
 *   3. Save only if the set grew — keeps the run idempotent.
 *
 * Run with:
 *   yarn --cwd backend migrate:casino-dealers
 */

type CasinoCounter = {
  scanned: number;
  updated: number;
  unchanged: number;
};

async function main(): Promise<void> {
  const env = loadEnv();
  console.log(`[migrate] target Parse server: ${env.PARSE_SERVER_URL}`);
  const parse = initParseClient(env);

  const counter: CasinoCounter = { scanned: 0, updated: 0, unchanged: 0 };

  const casinos = await new parse.Query(parse.Object.extend("Casino"))
    .notEqualTo("exists", false)
    .limit(10_000)
    .find({ useMasterKey: true });

  for (const casino of casinos) {
    counter.scanned += 1;

    const currentDealers =
      (casino.get("dealers") as Parse.Object[] | undefined) ?? [];
    const currentIds = new Set(
      currentDealers
        .map((d) => d?.id)
        .filter((id): id is string => typeof id === "string"),
    );

    const mesas = await new parse.Query(parse.Object.extend("Mesa"))
      .notEqualTo("exists", false)
      .equalTo("casino", casino)
      .limit(10_000)
      .find({ useMasterKey: true });

    const discoveredIds = new Set<string>();
    for (const mesa of mesas) {
      const ptr = mesa.get("tallador") as Parse.Object | undefined;
      if (ptr?.id) discoveredIds.add(ptr.id);
    }

    const unionSize = currentIds.size + [...discoveredIds].filter(
      (id) => !currentIds.has(id),
    ).length;

    if (unionSize === currentIds.size) {
      counter.unchanged += 1;
      continue;
    }

    const UserCls = parse.Object.extend("AppUser");
    const unionArray = Array.from(new Set([...currentIds, ...discoveredIds]));
    casino.set(
      "dealers",
      unionArray.map((id) => UserCls.createWithoutData(id)),
    );
    await casino.save(null, { useMasterKey: true });
    counter.updated += 1;
    console.log(
      `[migrate] Casino ${casino.id} (${casino.get(
        "name",
      )}): dealers ${currentIds.size} → ${unionArray.length}`,
    );
  }

  console.log(
    `[migrate] done. scanned=${counter.scanned} updated=${counter.updated} unchanged=${counter.unchanged}`,
  );
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
