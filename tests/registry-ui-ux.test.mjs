import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function sourceBlock(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return appSource.slice(start, end);
}

test("registry multi-select stays open and restores focus through repeated changes", () => {
  const block = sourceBlock("function updateRegistryMultiFilter(", "function scheduleRegistryFilterRender(");
  const focusBlock = sourceBlock("function restorePendingRegistryMultiFilterFocus(", "function rememberTaskRegistryTableScrollLeft(");
  const resetRegistryPagination = (scope) => { context.resetScope = scope; };
  let checkboxes = [];
  let lastFocused = null;
  const details = { querySelectorAll: () => checkboxes.filter((item) => item.checked) };
  const context = {
    state: {
      filters: { applications: { status: [] } },
      registryMultiSelectExpanded: { "applications:status": false }
    },
    resetRegistryPagination,
    document: {
      querySelectorAll: () => checkboxes
    }
  };
  vm.runInNewContext(`${block}\n${focusBlock}\nglobalThis.update = updateRegistryMultiFilter; globalThis.restoreFocus = restorePendingRegistryMultiFilterFocus;`, context);
  const changes = [
    { selected: ["В работе", "Требуется доработка"], focus: "В работе" },
    { selected: ["В работе"], focus: "Требуется доработка" },
    { selected: ["В работе", "Новая"], focus: "Новая" }
  ];
  for (const change of changes) {
    checkboxes = ["В работе", "Новая", "Требуется доработка"].map((value) => ({
      value,
      checked: change.selected.includes(value),
      dataset: { filterScope: "applications", filterName: "status" },
      focus: () => { lastFocused = value; }
    }));
    context.update({
      dataset: { filterScope: "applications", filterName: "status" },
      closest: () => details
    });
    assert.deepEqual(Array.from(context.state.filters.applications.status), change.selected);
    assert.equal(context.state.registryMultiSelectExpanded["applications:status"], true);
    context.state.pendingRegistryMultiFilterFocus = {
      scope: "applications",
      name: "status",
      value: change.focus
    };
    context.restoreFocus();
    assert.equal(lastFocused, change.focus);
    assert.equal(context.state.pendingRegistryMultiFilterFocus, null);
  }

  assert.equal(context.resetScope, "applications");
  assert.match(appSource, /state\.pendingRegistryMultiFilterFocus\s*=\s*\{[\s\S]*?updateRegistryMultiFilter\(event\.target\)/);
  assert.match(appSource, /restorePendingRegistryMultiFilterFocus\(\);/);
  assert.match(styles, /\.registry-filter-panel\.has-open-multi\s*\{[^}]*overflow:\s*visible;/s);
  assert.match(styles, /\.registry-filter-multi-options\s*\{[^}]*position:\s*absolute;[^}]*overflow-y:\s*auto;/s);
});

test("every registry table has an explicit width for each rendered column", () => {
  const block = sourceBlock("const REGISTRY_COLUMN_WIDTHS = {", "function getTaskRegistrySortContext(");
  const taskColumnsBlock = sourceBlock("function getTaskRegistryColumns(", "function renderTaskRegistryTable(");
  const applicationColumnsBlock = sourceBlock("function getApplicationRegistryColumns(", "function renderApplicationsRegistry");
  const collateralColumnsBlock = sourceBlock("function getCollateralRegistryColumns()", "function renderCollateralsRegistry");
  const empty = () => "";
  const context = Object.fromEntries([
    "getApplicationType", "getApplicationSubtype", "getApplicationPurpose", "getApplicationInitiator",
    "getApplicationRegistrySegment", "getApplicationClientName", "getApplicationInn",
    "getCollateralRegistryName", "getCollateralTypeLabel", "getCollateralRegistryCreditContractText",
    "getCollateralRegistryLatestAppraisalDate", "getCollateralRegistryAddress", "getCollateralStatusForFt"
  ].map((name) => [name, empty]));
  vm.runInNewContext(`${block}\n${taskColumnsBlock}\n${applicationColumnsBlock}\n${collateralColumnsBlock}\nglobalThis.widths = REGISTRY_COLUMN_WIDTHS; globalThis.minimums = REGISTRY_COLUMN_MIN_WIDTHS; globalThis.renderWidths = renderRegistryColumnWidths; globalThis.columnWidthValues = getRegistryColumnWidthValues; globalThis.taskColumns = getTaskRegistryColumns; globalThis.applicationColumns = getApplicationRegistryColumns; globalThis.collateralColumns = getCollateralRegistryColumns;`, context);
  const expectedTaskWidths = { evaluation: 2104, inspection: 2124, registration: 2054 };

  for (const [direction, expectedWidth] of Object.entries(expectedTaskWidths)) {
    const renderedWidths = [];
    for (const tab of ["mine", "completed"]) {
      const columns = Array.from(context.taskColumns(direction, tab));
      const markup = context.renderWidths(columns, "tasks", direction);
      const widths = Array.from(markup.matchAll(/width:(\d+)px/g), (match) => Number(match[1]));
      assert.equal(widths.length, columns.length, `${direction}/${tab} columns`);
      assert.ok(widths.every((width) => Number.isInteger(width) && width >= 70));
      renderedWidths.push(widths.reduce((sum, width) => sum + width, 0));
    }
    assert.equal(Math.max(...renderedWidths), expectedWidth, `${direction} table width matches its widest tab`);
    assert.match(styles, new RegExp(`\\.task-table-modern--${direction}\\s*\\{[^}]*min-width:\\s*${expectedWidth}px;`));
  }
  for (const [scope, columns, expectedWidth] of [
    ["applications", Array.from(context.applicationColumns()), 1635],
    ["collaterals", Array.from(context.collateralColumns()), 1845]
  ]) {
    const markup = context.renderWidths(columns, scope);
    const widths = Array.from(markup.matchAll(/width:(\d+)px/g), (match) => Number(match[1]));
    assert.equal(widths.length, columns.length, `${scope} columns`);
    assert.ok(widths.every((width) => Number.isInteger(width) && width >= 70));
    assert.equal(widths.reduce((sum, width) => sum + width, 0), expectedWidth, `${scope} table width matches its columns`);
    const tableClass = scope === "applications" ? "applications-table" : "collaterals-table";
    assert.match(styles, new RegExp(`\\.${tableClass}\\s*\\{[^}]*min-width:\\s*${expectedWidth}px;`));
  }

  assert.match(appSource, /renderRegistryColumnWidths\(visibleColumns, "tasks", direction\)/);
  assert.match(appSource, /renderRegistryColumnWidths\(columns, "applications"\)/);
  assert.match(appSource, /renderRegistryColumnWidths\(columns, "collaterals"\)/);
  assert.match(styles, /\.collaterals-table\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*1845px;/s);
  assert.equal(context.widths.tasks.registration.collateral, 84, "registration collateral count column stays compact");
  assert.equal(context.widths.applications.application, 160, "application number column remains readable and can wrap");

  context.window = { innerWidth: 1920 };
  const responsiveTables = [
    ...["evaluation", "inspection", "registration"].flatMap((direction) => [
      ["tasks", Array.from(context.taskColumns(direction, "mine")), direction],
      ["tasks", Array.from(context.taskColumns(direction, "completed")), direction]
    ]),
    ["applications", Array.from(context.applicationColumns()), ""],
    ["collaterals", Array.from(context.collateralColumns()), ""]
  ];
  for (const [scope, columns, partition] of responsiveTables) {
    const values = Array.from(context.columnWidthValues(columns, scope, partition));
    const minimums = scope === "tasks" ? context.minimums.tasks[partition] : context.minimums[scope];
    const minimumWidth = columns.reduce((sum, column) => sum + minimums[column.key], 0);
    const width = values.reduce((sum, value) => sum + value, 0);
    assert.ok(values.every((value, index) => value >= minimums[columns[index].key]), `${scope}/${partition} preserves readable minimums`);
    assert.ok(width >= Math.min(1660, minimumWidth), `${scope}/${partition} uses available width before scrolling`);
    assert.ok(width <= Math.max(1660, minimumWidth), `${scope}/${partition} only scrolls when readable minimums require it`);
    if (scope === "tasks") {
      const byKey = Object.fromEntries(columns.map((column, index) => [column.key, values[index]]));
      assert.ok(byKey.task >= 105 && byKey.application >= 110 && byKey.client >= 120, `${partition} keeps task, application, and client columns readable`);
    }
  }
  context.window = { innerWidth: 2560 };
  assert.equal(context.columnWidthValues(Array.from(context.collateralColumns()), "collaterals").reduce((sum, width) => sum + width, 0), 1845);
});

test("registry column visibility and order persist by user and registry", () => {
  const helpers = sourceBlock("function getRegistryColumnPreferenceKey(", "const REGISTRY_COLUMN_WIDTHS = {");
  const columns = [
    { key: "number", label: "Номер" },
    { key: "client", label: "Клиент" },
    { key: "status", label: "Статус" }
  ];
  const stored = new Map();
  const context = {
    state: { registryColumnSettings: {}, registryColumnSettingsOpen: "" },
    REGISTRY_COLUMN_SETTINGS_STORAGE_KEY: "registry-columns",
    getRole: () => ({ id: "evaluationManager", user: "Анна" }),
    localStorage: { setItem: (key, value) => stored.set(key, value) },
    escapeHtml: (value) => String(value),
    getTaskRegistryColumns: () => columns,
    getApplicationRegistryColumns: () => columns,
    getCollateralRegistryColumns: () => columns,
    resetRegistryPagination: () => {}
  };
  vm.runInNewContext(`${helpers}\nglobalThis.getVisible = getVisibleRegistryColumns; globalThis.getOrdered = getOrderedRegistryColumns; globalThis.reorder = reorderRegistryColumns; globalThis.save = saveRegistryColumnPreferences; globalThis.getPreferences = getRegistryColumnPreferences; globalThis.renderSettings = renderRegistryColumnSettings;`, context);

  assert.deepEqual(Array.from(context.getVisible(columns, "tasks", "evaluation"), (column) => column.key), ["number", "client", "status"]);
  assert.equal(context.reorder(columns, "tasks", "evaluation", "status", "client"), true);
  assert.deepEqual(Array.from(context.getOrdered(columns, "tasks", "evaluation"), (column) => column.key), ["number", "status", "client"]);
  context.save("tasks", "evaluation", { order: ["number", "status", "client"], hidden: ["client"] });
  assert.deepEqual(Array.from(context.getVisible(columns, "tasks", "evaluation"), (column) => column.key), ["number", "status"]);
  assert.deepEqual(Array.from(context.getVisible(columns, "applications"), (column) => column.key), ["number", "client", "status"]);
  assert.ok(stored.size > 0, "user settings are written to localStorage");
  assert.match(context.renderSettings(columns, "tasks", "evaluation"), /data-registry-column-visibility/);
  assert.match(appSource, /document\.addEventListener\("dragstart"/);
  assert.match(appSource, /document\.addEventListener\("drop"/);
});

test("registry pages use the available workspace width and retain narrower mobile gutters", () => {
  assert.match(styles, /\.main\.registry-main\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*none;[^}]*min-width:\s*0;[^}]*padding:\s*10px 16px 12px;/s);
  assert.match(styles, /@media\s*\(max-width:\s*720px\)\s*\{\s*\.main\.registry-main\s*\{\s*padding:\s*8px;/s);
  assert.match(styles, /\.applications-table\s*\{[^}]*width:\s*100%;/s);
  assert.match(styles, /\.task-table-modern\s*\{[^}]*width:\s*100%;/s);
});

test("sort indicators are larger and retain clear contrast in both states", () => {
  assert.match(styles, /\.registry-sort-marker\s*\{[^}]*font-size:\s*15px;[^}]*font-weight:\s*900;/s);
  assert.match(styles, /\.registry-sort-marker-active\s*\{[^}]*color:\s*#1d4ed8;/s);
  assert.match(styles, /\.registry-sort-marker-empty\s*\{[^}]*opacity:\s*1;/s);
  assert.match(appSource, /registry-sort-marker registry-sort-marker-active/);
});

test("registry table headers do not split Russian words with automatic hyphenation", () => {
  assert.match(styles, /\.registry-work-area \.task-table-modern th,[\s\S]*?overflow-wrap:\s*normal;\s*hyphens:\s*none;/);
});
