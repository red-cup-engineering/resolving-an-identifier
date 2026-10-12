import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { findDataRecord, readDataPool } from "../src/resolve-an-identifier.js";

test("data pools replay live one-file JSON before append-log snapshots", async (t) => {
  const base = await mkdtemp(join(tmpdir(), "identifier-data-pool-"));
  t.after(() => rm(base, { recursive: true, force: true }));

  await mkdir(join(base, "legacy"), { recursive: true });
  await writeFile(join(base, "legacy", "alpha.json"), JSON.stringify({ id: "alpha", value: "legacy" }));
  await mkdir(join(base, "2026", "07", "29"), { recursive: true });
  await writeFile(
    join(base, "2026", "07", "29", "2026-07-29-node-requirements.jsonl"),
    `${JSON.stringify({ id: "alpha", value: "append" })}\n${JSON.stringify({ id: "beta" })}\n`,
  );

  assert.deepEqual(readDataPool(base, "requirements").map(({ record }) => record.value ?? record.id), [
    "legacy",
    "append",
    "beta",
  ]);
  assert.equal(findDataRecord(base, "requirements", "alpha")?.record.value, "append");
});
