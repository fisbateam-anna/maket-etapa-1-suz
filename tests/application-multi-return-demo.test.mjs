import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { initialData, seedTaskNumberAliases } from "../src/data.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const applicationId = "app-1126-014";

function extractBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return appSource.slice(start, end);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

test("returned-work demo has three linked tasks and two active initiator returns", () => {
  const application = initialData.applications.find((item) => item.id === applicationId);
  assert.ok(application, "demo application should exist in initial data");
  assert.equal(application.status, "Требуется доработка");
  assert.equal(application.initiator, "Анна Кузнецова");

  const tasks = initialData.tasks.filter((task) => task.applicationId === applicationId);
  assert.equal(tasks.length, 3);
  assert.deepEqual(tasks.map((task) => task.id).sort(), [
    seedTaskNumberAliases["tsk-18112026-001"],
    seedTaskNumberAliases["tsk-18112026-002"],
    seedTaskNumberAliases["tsk-18112026-003"]
  ]);
  assert.ok(tasks.every((task) => application.taskIds.includes(task.id)));
  assert.ok(tasks.every((task) => task.collateralIds.every((id) => application.collateralIds.includes(id))));

  const activeReturns = tasks.filter((task) => task.status === "Ожидание" && task.returnToInitiator && !task.returnToInitiator.resolvedAt);
  assert.equal(activeReturns.length, 2);
  assert.ok(activeReturns.every((task) => task.assignee === application.initiator));
  assert.ok(activeReturns.every((task) => task.returnToInitiator.reason && task.returnToInitiator.comment));
  assert.equal(tasks.filter((task) => task.status === "В работе" && !task.returnToInitiator).length, 1);

  const registryStatusSource = extractBetween("function getApplicationRegistryStatus(status)", "function getApplicationStatusOptions()");
  const statusSandbox = { APPLICATION_REGISTRY_STATUSES: ["Новая", "В работе", "Требуется доработка", "Завершена"] };
  vm.runInNewContext(`${registryStatusSource}\nglobalThis.getStatus = getApplicationRegistryStatus;`, statusSandbox);
  assert.equal(statusSandbox.getStatus(application.status), "Требуется доработка");
});

test("application return panel renders exactly the two active returns from the demo", () => {
  const application = initialData.applications.find((item) => item.id === applicationId);
  const tasks = initialData.tasks.filter((task) => task.applicationId === applicationId);
  const helperSource = extractBetween("function getApplicationReturnRequests(application)", "function getApplicationCollaterals(application)");
  const renderSource = extractBetween("function renderApplicationReturnNotice(application)", "function renderApplicationLinkedTaskNumberCell(task)");
  const sandbox = {
    getApplicationTasks: () => tasks,
    getTaskApplicationInitiator: (task) => task.returnToInitiator?.initiator || "",
    getTaskDisplayType: () => "Физический осмотр",
    getRole: () => ({ user: "Анна Кузнецова" }),
    formatRegistryDateTime: (value) => value,
    escapeHtml,
    getTaskCardRoute: (task) => `/app/tasks/${task.id}`
  };
  vm.runInNewContext(`${helperSource}\n${renderSource}\nglobalThis.renderNotice = renderApplicationReturnNotice;`, sandbox);

  const html = sandbox.renderNotice(application);
  assert.equal((html.match(/data-action="submit-application-return-response"/g) || []).length, 2);
  assert.match(html, new RegExp(seedTaskNumberAliases["tsk-18112026-001"]));
  assert.match(html, new RegExp(seedTaskNumberAliases["tsk-18112026-002"]));
  assert.doesNotMatch(html, new RegExp(seedTaskNumberAliases["tsk-18112026-003"]));
  assert.match(html, /актуальную выписку ЕГРН/);
  assert.match(html, /Уточните VIN автомобиля/);
});
