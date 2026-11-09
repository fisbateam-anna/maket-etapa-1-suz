import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function sourceBlock(startMarker, endMarker) {
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

test("task registry filters follow the revised FT order and disable author only for registration", () => {
  const registry = sourceBlock("function renderTasksRegistry(", "function renderContractsRegistry(");
  const filterGrid = registry.slice(registry.indexOf("const filterGridMarkup ="), registry.indexOf("return `\n    <section class=\"registry-work-area registry-work-area-tasks\">"));
  const filterKeys = [...filterGrid.matchAll(/filter(?:Select|Input|DateRange)\("tasks",\s*"([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(filterKeys, [
    "author", "assignee", "number", "type", "status", "applicationNumber", "clientName", "contractNumber",
    "initiator", "initiatorSegment", "collateralId", "collateralName", "collateralType", "pledgor",
    "createdFrom", "dueFrom", "completedFrom"
  ]);
  assert.match(filterGrid, /filterSelect\("tasks", "author"[^\n]+disabled: direction === "registration"/);
  assert.match(filterGrid, /valueOverride: activeTab === "completed" \? "Завершена" : null/);
  assert.match(filterGrid, /filterInput\("tasks", "pledgor", "Залогодатель", "Наименование, ФИО или ИНН"\)/);
});

test("registration ignores a saved author filter while other task registries retain exact matching", () => {
  const registry = sourceBlock("function renderTasksRegistry(", "function renderContractsRegistry(");
  assert.match(registry, /direction === "registration" \|\| matchesExact\(getTaskRegistryAuthor\(task\), filters\.author\)/);
});

test("executor filter options and matching include verifier, executor, and manager assignments", () => {
  const participants = sourceBlock("function getTaskRegistryAssigneeNames(", "function getApplicationInitiatorOptions(");
  assert.match(participants, /getTaskVerifierNames\(task\)/);
  assert.match(participants, /getTaskExecutorNames\(task\)/);
  assert.match(participants, /getTaskManagerNames\(task\)/);

  const registry = sourceBlock("function renderTasksRegistry(", "function renderContractsRegistry(");
  assert.match(registry, /matchesAnyExact\(getTaskRegistryAssigneeNames\(task\), filters\.assignee\)/);
});

test("pledgor registry filters show the FT hint and search partial name or INN matches", () => {
  const taskRegistry = sourceBlock("function renderTasksRegistry(", "function renderContractsRegistry(");
  const collateralRegistry = sourceBlock("function renderCollateralsRegistry(", "function renderApplicationContractLinks(");

  assert.match(taskRegistry, /filterInput\("tasks", "pledgor", "Залогодатель", "Наименование, ФИО или ИНН"\)/);
  assert.match(collateralRegistry, /filterInput\("collaterals", "pledgor", "Залогодатель", "Наименование, ФИО или ИНН"\)/);
  assert.match(collateralRegistry, /matches\(getCollateralRegistryPledgorSearchText\(item\)\.join\(" "\), filters\.pledgor\)/);
  assert.doesNotMatch(collateralRegistry, /matchesAnyExact\(getCollateralRegistryPledgorSearchText\(item\), filters\.pledgor\)/);
});

test("empty multi-select selections do not filter out every registry row", () => {
  const block = sourceBlock("function matchesSelectedValues(", "function matchesDateRange(");
  const context = {};
  vm.runInNewContext(`${block}\nglobalThis.matchesSelectedValues = matchesSelectedValues;`, context);

  assert.equal(context.matchesSelectedValues(["Новый"], []), true);
  assert.equal(context.matchesSelectedValues(["Новый"], ["В залоге"]), false);
  assert.equal(context.matchesSelectedValues(["Новый", "В залоге"], ["В залоге"]), true);
});

test("completed task status is displayed as selected and remains disabled", () => {
  const block = sourceBlock("function filterSelect(", "function filterMultiSelect(");
  const context = {
    state: { filters: { tasks: { status: "В работе" } } },
    escapeHtml
  };
  vm.runInNewContext(`${block}\nglobalThis.renderSelect = filterSelect;`, context);

  const markup = context.renderSelect("tasks", "status", "Статус задачи", ["", "В работе", "Завершена"], {
    disabled: true,
    valueOverride: "Завершена"
  });
  assert.match(markup, /<select[^>]*disabled>/);
  assert.match(markup, /<option value="Завершена" selected>Завершена<\/option>/);
  assert.doesNotMatch(markup, /value="В работе" selected/);
});

test("stage-two defectation is excluded from task registry data and type options", () => {
  const typeRules = sourceBlock("function isStage1TaskType(", "function getTaskRegistryAuthorOptions(");
  assert.match(typeRules, /function isTaskRegistryStage1Type\(type\)\s*\{\s*return isStage1TaskType\(type\) && !isDefectInspectionTaskType\(type\);/);
  const options = sourceBlock("function getTaskRegistryTypeOptions(", "function isStage1TaskType(");
  assert.match(options, /getTaskDirection\(\{ type \}\) === direction && isTaskRegistryStage1Type\(type\)/);
  const registry = sourceBlock("function renderTasksRegistry(", "function renderContractsRegistry(");
  assert.match(registry, /getTaskDirection\(task\) !== direction \|\| !isTaskRegistryStage1Type\(task\.type\)/);
});
