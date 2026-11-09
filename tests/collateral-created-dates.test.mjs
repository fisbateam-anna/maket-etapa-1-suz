import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import { initialData, normalizeCollateralCreationDates } from "../src/data.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function buildRuntimeDataWithSavedCollaterals(savedCollaterals) {
  const start = appSource.indexOf("function buildRuntimeData() {");
  const end = appSource.indexOf("\nfunction restoreLegacyApplicationInitialTaskMarkers", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  const context = {
    initialData,
    clone: (value) => JSON.parse(JSON.stringify(value)),
    readSavedStateSnapshot: () => ({ state: { collaterals: savedCollaterals } }),
    migrateSavedObjectNumbers: (snapshot) => ({ state: snapshot.state, aliases: {}, changed: false }),
    remapScreenshotFixtureIdsForSavedState: (data) => data,
    normalizeCollateralCreationDates,
    normalizeCollateralRecordsForFtV7: (collaterals) => collaterals,
    mergeSavedCollateralWithBase: (saved, base) => ({ ...(base || {}), ...saved }),
    normalizeDataApplicationSingleClient: (data, application) => application,
    normalizeTaskRecord: (task) => task,
    ensureTaskRegistryExamples: (data) => data,
    restoreLegacyApplicationInitialTaskMarkers: (data) => data,
    ensureDocumentFollowupExamples: (data) => data,
    ensureApplicationsHaveInitialTasks: (data) => data,
    enrichTaskApplications: (data) => data,
    sanitizeMvp1Data: (data) => data,
    ensureTaskSetterComments: (data) => data,
    TASK_STATE_STORAGE_KEY: "test-state",
    legacyObjectNumberAliases: {}
  };
  vm.runInNewContext(`${appSource.slice(start, end)}\nglobalThis.build = buildRuntimeData;`, context);
  return context.build();
}

test("every seeded test collateral has a valid creation date", () => {
  assert.ok(initialData.collaterals.length > 0);
  for (const collateral of initialData.collaterals) {
    assert.match(collateral.createdAt, /^\d{4}-\d{2}-\d{2}$/i, collateral.id);
    assert.equal(Number.isNaN(Date.parse(`${collateral.createdAt}T00:00:00Z`)), false, collateral.id);
  }
});

test("missing dates are backfilled deterministically before the last update", () => {
  const oldSavedCollateral = { id: "COL-LEGACY-901", updatedAt: "2026-10-27 09:55" };
  const first = normalizeCollateralCreationDates([oldSavedCollateral])[0];
  const second = normalizeCollateralCreationDates([oldSavedCollateral])[0];

  assert.match(first.createdAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(first.createdAt, second.createdAt);
  assert.ok(first.createdAt < "2026-10-27");
});

test("invalid update dates use a stable fallback instead of leaving the field empty", () => {
  const invalidUpdatedAt = { id: "COL-BAD-UPDATE-DATE", updatedAt: "2026-02-31 09:55" };
  const first = normalizeCollateralCreationDates([invalidUpdatedAt])[0];
  const second = normalizeCollateralCreationDates([invalidUpdatedAt])[0];
  const withoutUpdatedAt = normalizeCollateralCreationDates([{ id: invalidUpdatedAt.id }])[0];

  assert.match(first.createdAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(first.createdAt, second.createdAt);
  assert.equal(first.createdAt, withoutUpdatedAt.createdAt);
  assert.notEqual(first.createdAt, "2026-03-03");
});

test("existing creation dates and collateral fields are preserved", () => {
  const collateral = { id: "COL-KEEP-1", createdAt: "2026-04-12 08:30", name: "Склад" };
  assert.deepEqual(normalizeCollateralCreationDates([collateral])[0], collateral);
});

test("runtime restoration fills dates for legacy saved collateral records", () => {
  const seededCollateral = initialData.collaterals[0];
  const runtime = buildRuntimeDataWithSavedCollaterals([
    { id: seededCollateral.id, name: seededCollateral.name },
    { id: "COL-OLD-LOCAL-901", updatedAt: "not-a-date" }
  ]);
  const restoredSeed = runtime.collaterals.find((item) => item.id === seededCollateral.id);
  const restoredLegacy = runtime.collaterals.find((item) => item.id === "COL-OLD-LOCAL-901");

  assert.equal(restoredSeed.createdAt, seededCollateral.createdAt);
  assert.match(restoredLegacy.createdAt, /^\d{4}-\d{2}-\d{2}$/);
});
