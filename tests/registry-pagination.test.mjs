import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function getSourceBlock(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return appSource.slice(start, end);
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
}

function createPaginationHelpers() {
  const context = { state: { registryPages: {} }, escapeHtml };
  const block = getSourceBlock("const REGISTRY_PAGE_SIZE = 25;", "function renderRegistryResultCount(");
  vm.runInNewContext(`${block}\nglobalThis.getPageData = getRegistryPageData; globalThis.resetPages = resetRegistryPagination; globalThis.renderPagination = renderRegistryPagination;`, context);
  return context;
}

test("pagination covers empty results and the 25-row page boundary", () => {
  const helpers = createPaginationHelpers();
  const empty = helpers.getPageData([], "applications");
  assert.equal(empty.page, 1);
  assert.equal(empty.pageCount, 1);
  assert.deepEqual(Array.from(empty.rows), []);
  assert.equal(empty.start, 0);
  assert.equal(empty.end, 0);

  const rows = Array.from({ length: 26 }, (_, index) => index + 1);
  const first = helpers.getPageData(rows, "applications");
  assert.equal(first.rows.length, 25);
  assert.equal(first.rows[0], 1);
  assert.equal(first.rows.at(-1), 25);
  assert.equal(first.pageCount, 2);
  assert.equal(first.start, 1);
  assert.equal(first.end, 25);

  helpers.state.registryPages.applications = 2;
  const second = helpers.getPageData(rows, "applications");
  assert.deepEqual(Array.from(second.rows), [26]);
  assert.equal(second.start, 26);
  assert.equal(second.end, 26);
});

test("pagination clamps stale page numbers after filtering and renders disabled bounds", () => {
  const helpers = createPaginationHelpers();
  helpers.state.registryPages.tasks = 5;
  const filtered = helpers.getPageData(["only result"], "tasks");
  assert.equal(filtered.page, 1);
  assert.equal(helpers.state.registryPages.tasks, 1);

  const markup = helpers.renderPagination("tasks", filtered);
  assert.match(markup, /Показано 1 из 1/);
  assert.match(markup, /Страница 1 из 1/);
  assert.match(markup, /aria-label="Предыдущая страница" disabled/);
  assert.match(markup, /aria-label="Следующая страница" disabled/);

  helpers.state.registryPages["tasks:evaluation:all"] = 4;
  helpers.state.registryPages.applications = 3;
  helpers.resetPages("tasks");
  assert.equal(helpers.state.registryPages["tasks:evaluation:all"], 1);
  assert.equal(helpers.state.registryPages.applications, 3);
});

test("all menu registry families paginate filtered rows while counting the full result", () => {
  const tasks = getSourceBlock("function renderTasksRegistry(", "\nfunction renderContractsRegistry");
  const collaterals = getSourceBlock("function renderCollateralsRegistry(", "\nfunction renderCollateralRegistryContractsCell");
  const applications = getSourceBlock("function renderApplicationsRegistry()", "\nfunction renderCollateralControlPanel");

  for (const block of [tasks, collaterals, applications]) {
    assert.match(block, /getRegistryPageData\(sortedRows, pageKey\)/);
    assert.match(block, /renderRegistryPagination\(pageKey, pageData\)/);
    assert.match(block, /renderRegistryResultCount\([^,]+, rows\.length\)/);
    assert.match(block, /class="registry-table-scroll"/);
  }
  assert.match(tasks, /renderTaskRegistryTable\(pageData\.rows, direction, activeTab, columns\)/);
  assert.match(collaterals, /pageData\.rows\.map\(\(item\)/);
  assert.match(applications, /pageData\.rows\.map\(\(application\)/);
  assert.match(appSource, /const REGISTRY_PAGE_SIZE = 25;/);
});
