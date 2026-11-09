import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { initialData } from "../src/data.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

test("showcase physical inspection includes exactly five vehicles", () => {
  const task = initialData.tasks.find((item) => item.id === "tsk-27102026-001");
  assert.ok(task, "showcase task must exist");
  assert.equal(task.type, "Первичный осмотр");
  assert.equal(task.inspectionFormat, "Физический осмотр");
  assert.equal(task.collateralIds.length, 5);
  assert.equal(new Set(task.collateralIds).size, 5);
  assert.equal(task.client, "ООО Волга Логистик");

  const collaterals = task.collateralIds.map((id) => initialData.collaterals.find((item) => item.id === id));
  assert.ok(collaterals.every(Boolean), "all five collateral records must exist");
  assert.ok(collaterals.every((item) => item.type === "Автотранспорт"), "all five objects must be vehicles");
  assert.ok(collaterals.every((item) => item.clientName === task.client), "all vehicles must belong to the task client");

  const application = initialData.applications.find((item) => item.id === task.applicationId);
  assert.ok(application, "task application must exist");
  assert.ok(application.taskIds.includes(task.id), "application must link to the task");
});

test("showcase task uses the application's direct task-card route", () => {
  const start = appSource.indexOf("function getTaskCardRoute(taskOrId)");
  const end = appSource.indexOf("\nfunction getApplicationCardRoute", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const sandbox = { legacyObjectNumberAliases: {} };
  vm.runInNewContext(`${appSource.slice(start, end)}\nglobalThis.route = getTaskCardRoute;`, sandbox);
  assert.equal(sandbox.route("tsk-27102026-001"), "/app/tasks/tsk-27102026-001");
});
