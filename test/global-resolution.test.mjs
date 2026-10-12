import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { resolveIdentifier } from "../src/resolve-an-identifier.js";

test("global strategy finds a seat repeated across two ventures' offices/ pools", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "identifier-global-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  await mkdir(join(root, "venture-a", "offices"), { recursive: true });
  await writeFile(join(root, "venture-a", "offices", "executive-assistant.json"), JSON.stringify({ id: "executive-assistant" }));
  await mkdir(join(root, "venture-b", "offices"), { recursive: true });
  await writeFile(join(root, "venture-b", "offices", "executive-assistant.json"), JSON.stringify({ id: "executive-assistant" }));

  const result = resolveIdentifier("executive-assistant", { kind: "offices", strategy: "global", root });

  assert.equal(result.ok, true);
  assert.equal(result.strategy, "global");
  assert.equal(result.pools.length, 2);
  assert.equal(result.seats.length, 2);
  assert.ok(result.seats.some((s) => s.includes("venture-a")));
  assert.ok(result.seats.some((s) => s.includes("venture-b")));
});

test("global strategy with no seat returns ok:true, seats:[]", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "identifier-global-empty-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  await mkdir(join(root, "venture-a", "offices"), { recursive: true });

  const result = resolveIdentifier("nobody-home", { kind: "offices", strategy: "global", root });

  assert.deepEqual(result, {
    ok: true,
    ref: "nobody-home",
    kind: "offices",
    slug: "nobody-home",
    strategy: "global",
    pools: [join(root, "venture-a", "offices")],
    seats: [],
    seat: null,
  });
});

test("an unknown strategy is refused by name", () => {
  const result = resolveIdentifier("some-slug", { kind: "offices", strategy: "tree-wide" });
  assert.equal(result.ok, false);
  assert.match(result.error, /tree-wide/);
  assert.match(result.error, /neither nearest nor global/);
});
