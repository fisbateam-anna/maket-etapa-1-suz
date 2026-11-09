import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { initialData } from "../src/data.js";
import { resolveTaskAuthorName } from "../src/task-author.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const applicationId = "app-27102026-001";
const vehicleTaskId = "tsk-27102026-004";

function getGroupingKey(collateral) {
  const pledgor = collateral.pledgors?.find((item) => item.role === "Залогодатель") || collateral.pledgors?.[0];
  const city = collateral.addressFields?.["Город"] || collateral.region;
  return [city, collateral.type, pledgor?.name].join("|");
}

test("showcase application is split into complete city/type/pledgor groups", () => {
  const application = initialData.applications.find((item) => item.id === applicationId);
  assert.ok(application, "showcase application must exist");
  assert.equal(application.applicationType, "Осмотр имущества");
  assert.equal(application.applicationSubtype, "Первоначальный осмотр");
  assert.equal(application.clientName, "ООО СибТрансСервис");
  assert.equal(application.taskIds.length, 3);
  assert.equal(application.collateralIds.length, 9);

  const applicationCollaterals = application.collateralIds.map((id) => initialData.collaterals.find((item) => item.id === id));
  assert.ok(applicationCollaterals.every(Boolean), "all application collateral records must exist");
  assert.deepEqual(new Set(applicationCollaterals.map((item) => item.type)), new Set(["Автотранспорт", "Недвижимость", "Оборудование"]));
  assert.equal(new Set(applicationCollaterals.map((item) => item.pledgors[0].name)).size, 3, "groups must represent different pledgors");

  const tasks = application.taskIds.map((id) => initialData.tasks.find((item) => item.id === id));
  assert.ok(tasks.every(Boolean), "all automatically created tasks must exist");
  assert.ok(tasks.every((task) => task.applicationId === application.id));
  assert.ok(tasks.every((task) => task.createdFromApplicationAutomatically === true));
  assert.ok(tasks.every((task) => task.source === "Заявка"));
  assert.ok(tasks.every((task) => task.author === application.initiator));
  assert.ok(tasks.every((task) => resolveTaskAuthorName(task, { application }) === application.initiator));

  const assignedCollateralIds = tasks.flatMap((task) => task.collateralIds);
  assert.equal(new Set(assignedCollateralIds).size, application.collateralIds.length, "an object must not occur in multiple tasks");
  assert.deepEqual(new Set(assignedCollateralIds), new Set(application.collateralIds), "every application object must belong to one task");
  assert.equal(new Set(tasks.map((task) => getGroupingKey(initialData.collaterals.find((item) => item.id === task.collateralIds[0])))).size, 3);

  for (const task of tasks) {
    const keys = new Set(task.collateralIds.map((id) => getGroupingKey(initialData.collaterals.find((item) => item.id === id))));
    assert.equal(keys.size, 1, `${task.id} must contain one city/type/pledgor group`);
  }
});

test("showcase inspection task contains exactly five vehicles in one city and with one pledgor", () => {
  const task = initialData.tasks.find((item) => item.id === vehicleTaskId);
  const application = initialData.applications.find((item) => item.id === applicationId);
  assert.ok(task, "five-vehicle task must exist");
  assert.equal(task.applicationId, applicationId);
  assert.equal(task.type, "Первичный осмотр");
  assert.equal(task.inspectionFormat, "Физический осмотр");
  assert.equal(task.collateralIds.length, 5);
  assert.equal(new Set(task.collateralIds).size, 5);
  assert.ok(application.taskIds.includes(task.id));

  const vehicles = task.collateralIds.map((id) => initialData.collaterals.find((item) => item.id === id));
  assert.ok(vehicles.every(Boolean));
  assert.ok(vehicles.every((item) => item.type === "Автотранспорт"));
  assert.ok(vehicles.every((item) => item.addressFields["Город"] === "Новосибирск"));
  assert.ok(vehicles.every((item) => item.pledgors[0].name === "ООО СибТрансСервис"));
});

test("showcase task has a direct task-card route", () => {
  const start = appSource.indexOf("function getTaskCardRoute(taskOrId)");
  const end = appSource.indexOf("\nfunction getApplicationCardRoute", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const sandbox = { legacyObjectNumberAliases: {} };
  vm.runInNewContext(`${appSource.slice(start, end)}\nglobalThis.route = getTaskCardRoute;`, sandbox);
  assert.equal(sandbox.route(vehicleTaskId), `/app/tasks/${vehicleTaskId}`);
});
