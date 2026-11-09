import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { initialData } from "../src/data.js";
import { getNextDailyObjectNumber } from "../src/object-numbering.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const helperStart = appSource.indexOf("function remapScreenshotFixtureIdsForSavedState(");
const helperEnd = appSource.indexOf("\nfunction buildRuntimeData(", helperStart);
assert.notEqual(helperStart, -1);
assert.notEqual(helperEnd, -1);

const sandbox = { getNextDailyObjectNumber };
vm.runInNewContext(
  `${appSource.slice(helperStart, helperEnd)}\nglobalThis.remapScreenshotFixtureIdsForSavedState = remapScreenshotFixtureIdsForSavedState;`,
  sandbox
);

test("saved daily IDs do not suppress new fixtures or break their references", () => {
  const data = structuredClone(initialData);
  const seedTask = data.tasks.find((task) => task.id === "tsk-09112026-001");
  const seedApplication = data.applications.find((application) => application.id === "app-09112026-001");
  const secondSeedTask = data.tasks.find((task) => task.id === "tsk-09112026-002");
  secondSeedTask.parentTaskId = seedTask.id;
  const savedState = {
    tasks: [
      { id: "tsk-09112026-001", number: "tsk-09112026-001", createdAt: "2026-11-09 08:00" },
      { id: "tsk-09112026-022", number: "tsk-09112026-022", createdAt: "2026-11-09 10:00" }
    ],
    applications: [
      { id: "app-09112026-001", number: "app-09112026-001", createdAt: "2026-11-09 08:00" },
      { id: "app-09112026-013", number: "app-09112026-013", createdAt: "2026-11-09 10:00" }
    ]
  };
  const savedStateBefore = JSON.stringify(savedState);

  sandbox.remapScreenshotFixtureIdsForSavedState(data, savedState);

  assert.equal(seedTask.id, "tsk-09112026-023");
  assert.equal(seedApplication.id, "app-09112026-014");
  assert.equal(seedTask.applicationId, seedApplication.id);
  assert.equal(seedTask.applicationNumber, seedApplication.number);
  assert.ok(seedApplication.taskIds.includes(seedTask.id));
  assert.equal(secondSeedTask.parentTaskId, seedTask.id);
  assert.ok(seedTask.history[0].comment.includes(seedApplication.id));
  assert.equal(JSON.stringify(savedState), savedStateBefore, "saved user data must not be mutated");

  const persistedState = {
    tasks: [...savedState.tasks, ...data.tasks],
    applications: [...savedState.applications, ...data.applications]
  };
  const reloadedData = structuredClone(initialData);
  sandbox.remapScreenshotFixtureIdsForSavedState(reloadedData, persistedState);
  const reloadedTask = reloadedData.tasks.find((task) => task.screenshotFixtureKey === "screenshot-task-001");
  const reloadedApplication = reloadedData.applications.find((application) => application.screenshotFixtureKey === "screenshot-application-001");
  const mergedTaskIds = [
    ...persistedState.tasks.map((task) => task.id),
    ...reloadedData.tasks.filter((task) => !persistedState.tasks.some((saved) => saved.id === task.id)).map((task) => task.id)
  ];
  assert.equal(reloadedTask.id, seedTask.id, "fixture IDs must remain stable after a save and reload");
  assert.equal(reloadedApplication.id, seedApplication.id, "application fixture IDs must remain stable after a save and reload");
  assert.equal(new Set(mergedTaskIds).size, mergedTaskIds.length, "runtime merge must not duplicate tasks after reload");
});
